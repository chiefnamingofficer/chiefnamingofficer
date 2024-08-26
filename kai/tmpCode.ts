test
import json
import boto3
import urllib3
import hashlib
import os
from botocore.response import StreamingBody
import logging
import re

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

bedrock = boto3.client(service_name='bedrock-runtime')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('playground-poc-kai-preserve-conversation-context')
# lets not us static thread id for all conversations - id = "123e4567-e89b-12d3-a456-426614174000"
slackUrl = 'https://slack.com/api/chat.postMessage'
SlackChatHistoryUrl = 'https://slack.com/api/conversations.replies'
slackToken = os.environ.get('token')

http = urllib3.PoolManager()

# Dictionary to maintain conversation history per channel
conversation_history = {}

def call_bedrock(input_text):
    
    # Ensure input_text is a single string, not a list
    if isinstance(input_text, list):
        input_text = "\n".join(input_text)
    
    body = json.dumps({
        "inputText": input_text,
        "textGenerationConfig": {
            "maxTokenCount": 3072,
            "stopSequences": [],
            "temperature": 0.7,
            "topP": 0.9
        }
    })
    modelId = 'amazon.titan-text-premier-v1:0'
    accept = 'application/json'
    contentType = 'application/json'

    try:
        response = bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)

        if response is None:
            logger.error("Response from Bedrock model is None.")
            return "Sorry, I couldn't process your request at the moment."

        if isinstance(response.get('body'), StreamingBody):
            response_content = response['body'].read().decode('utf-8')
        else:
            response_content = response.get('body')

        if response_content is None:
            logger.error("Response content is None.")
            return "Sorry, I couldn't process your request at the moment."

        response_body = json.loads(response_content)

        logger.debug(f"Response body content: {response_body}")

        if response_body is None:
            logger.error("Response body is None.")
            return "Sorry, I couldn't process your request at the moment."

        # Adjusted to reflect the actual response structure
        results = response_body.get('results')
        if results and len(results) > 0:
            return results[0].get('outputText', "No text found in results.")
        else:
            logger.error("No results found in the response body.")
            return "Sorry, I couldn't process your request at the moment."

    except Exception as e:
        logger.error(f"Error calling Bedrock model: {e}")

    return "Sorry, I couldn't process your request at the moment."

# def call_bedrock(conversation):
#     body = json.dumps({
#         "prompt": conversation,
#         "maxTokens": 5000,
#         "temperature": 0.5,
#         "topP": 1,
#     })
#     #models with access ai21.j2-ultra-v1,ai21.j2-mid-v1,ai21.jamba-instruct-v1:0,meta.llama3-70b-instruct-v1:0,amazon.titan-text-premier-v1:0
#     #all have slightly different parameter needs - https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/models
#     modelId = 'ai21.j2-ultra-v1'
#     accept = 'application/json'
#     contentType = 'application/json'

#     try:
#         response = bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)

#         if isinstance(response.get('body'), StreamingBody):
#             response_content = response['body'].read().decode('utf-8')
#         else:
#             response_content = response.get('body')

#         response_body = json.loads(response_content)

#         return response_body.get('completions')[0].get('data').get('text')
#     except Exception as e:
#         logger.error(f"Error calling Bedrock model: {e}")
#         return "Sorry, I couldn't process your request at the moment."

#   new part 
def hash_message(message):
    msg_bytes = message.encode('utf-8')
    sha1 = hashlib.sha1(msg_bytes)
    hex_digest = sha1.hexdigest()
    
    return hex_digest
    
def get_message(thread_key):
    
    response = table.get_item(Key={'id': thread_key})
    if 'Item' in response and 'message' in response['Item']:
        return response['Item']['message']
    return None

    
def set_message(thread_key,message):
    
    table.update_item(
        Key={'id': thread_key},
        UpdateExpression="SET message = :value",
        ExpressionAttributeValues={':value': hash_message(message)}
    )
# new part end

# new handler with DB conversation history
def lambda_handler(event, context):
    headers = {
        'Authorization': f'Bearer {slackToken}',
        'Content-Type': 'application/json',
    }
    slackBody = json.loads(event['body'])
    print(json.dumps(slackBody))
    slackText = slackBody.get('event').get('text')
    slackUser = slackBody.get('event').get('user')
    channel =  slackBody.get('event').get('channel')
    thread_ts = slackBody.get('event').get('thread_ts')
    ts = slackBody.get('event').get('ts')
    eventType = slackBody.get('event').get('type')
    subtype = slackBody.get('event').get('subtype')
    bot_id = slackBody.get('event').get('bot_id')
    is_last_message_from_bot = False
    bedrockMsg = []
    
    # Unique key for each thread
    thread_key = f"{channel}-{thread_ts}"
    
    if eventType == 'message' and bot_id is None and subtype is None and thread_ts is not None:
        if get_message(thread_key) != hash_message(slackText):
            set_message(thread_key,slackText)
            # We got a new message in the thread lets pull from history
            historyResp = http.request('GET', f"{SlackChatHistoryUrl}?channel={channel}&ts={thread_ts}", headers=headers)
            response_data = historyResp.data.decode('utf-8')  # Decode the byte string to a UTF-8 string
            messages = json.loads(response_data).get('messages')  # Parse the string as JSON
            
            for message in messages:
                cleanMsg = re.sub(r'<@.*?>', '', message.get('text'))
                bot_profile = message.get('bot_profile')
                if bot_profile is None:
                    bedrockMsg.append(f'Human: {cleanMsg}')
                    is_last_message_from_bot = False
                else:
                    bedrockMsg.append(f'\n\nAssistant: {cleanMsg}')
                    is_last_message_from_bot = True
            bedrockMsg.append('\n\nAssistant:') # Message must always end with \n\nAssistant:
 
            if not is_last_message_from_bot: # Do not respond if the last message was a response
                msg = call_bedrock(bedrockMsg)
                data = {'channel': channel, 'text': f"<@{slackUser}> {msg}", 'thread_ts': thread_ts}
                response = http.request('POST', slackUrl, headers=headers, body=json.dumps(data))
        
    if (eventType == 'app_mention' and bot_id is None and thread_ts is None):
        # send an init message and thread the convo
        initMsg = re.sub(r'<@.*?>', '', slackText)
        bedrockMsg.append(f'Human: {initMsg} \n\nAssistant:')
        msg = call_bedrock(bedrockMsg)
        data = {'channel': channel, 'text': f"<@{slackUser}> {msg}", 'thread_ts': ts}
        response = http.request('POST', slackUrl, headers=headers, body=json.dumps(data))
    
    return {
        'statusCode': 200,
        'body': json.dumps({'msg': "message received"})
    }

# def lambda_handler(event, context):

#     logger.info("Received event: %s", json.dumps(event, indent=2))
#     slackBody = json.loads(event['body'])
#     slackText = slackBody.get('event').get('text')
#     slackUser = slackBody.get('event').get('user')
#     channel = slackBody.get('event').get('channel')
#     thread_ts = slackBody.get('event').get('ts')  # Get the thread timestamp


#     # Unique key for each thread
#     thread_key = f"{channel}-{thread_ts}"

#     # Initialize conversation history for the thread if not already present
#     if thread_key not in conversation_history:
#         conversation_history[thread_key] = []

#     # Add the new message to the conversation history
#     conversation_history[thread_key].append(f"Human: {slackText.replace('<@U06D5B8AR8R>', '')}")

#     # Formulate the conversation context
#     conversation_context = "\n\n".join(conversation_history[thread_key]) + "\n\nAssistant:"

#     msg = call_bedrock(conversation_context)

#     # Add the assistant's response to the conversation history
#     conversation_history[thread_key].append(f"Assistant: {msg}")

#     # Log the values
#     logger.info(f"Slack Text: {slackText}")
#     logger.info(f"Slack User: {slackUser}")
#     logger.info(f"Channel: {channel}")
#     logger.info(f"Thread TS: {thread_ts}")
#     logger.info(f"Message: {msg}")

#     data = {
#         'channel': channel,
#         'text': f"<@{slackUser}> {msg}",
#         'thread_ts': thread_ts  # Include the thread timestamp
#     }

#     headers = {
#         'Authorization': f'Bearer {slackToken}',
#         'Content-Type': 'application/json',
#     }

#     try:
#         response = http.request('POST', slackUrl, headers=headers, body=json.dumps(data))
#         # Log the response from Slack
#         logger.info(f"Slack Response: {response.data.decode('utf-8')}")
#     except Exception as e:
#         logger.error(f"Error sending message to Slack: {e}")

#     return {
#         'statusCode': 200,
#         'body': json.dumps({'msg': "message received"})
#     }

