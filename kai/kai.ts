import json
import boto3
import urllib3
import os
from botocore.response import StreamingBody
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

bedrock = boto3.client(service_name='bedrock-runtime')
slackUrl = 'https://slack.com/api/chat.postMessage'
slackToken = os.environ.get('token')

http = urllib3.PoolManager()

# Dictionary to maintain conversation history per channel
conversation_history = {}

def call_bedrock(conversation):
    body = json.dumps({
        "inputText": conversation,
        "maxTokens": 5000,
        "temperature": 0.5,
        "topP": 1,
    })

    modelId = 'ai21.j2-ultra-v1'
    accept = 'application/json'
    contentType = 'application/json'

    try:
        response = bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
        
        if isinstance(response.get('body'), StreamingBody):
            response_content = response['body'].read().decode('utf-8')
        else:
            response_content = response.get('body')

        response_body = json.loads(response_content)

        return response_body.get('completions')[0].get('data').get('text')
    except Exception as e:
        logger.error(f"Error calling Bedrock model: {e}")
        return "Sorry, I couldn't process your request at the moment."

def lambda_handler(event, context):
    slackBody = json.loads(event['body'])
    slackText = slackBody.get('event').get('text')
    slackUser = slackBody.get('event').get('user')
    channel = slackBody.get('event').get('channel')
    thread_ts = slackBody.get('event').get('ts')  # Get the thread timestamp

    # Initialize conversation history for the channel if not already present
    if channel not in conversation_history:
        conversation_history[channel] = []

    # Add the new message to the conversation history
    conversation_history[thread_ts].append(f"Human: {slackText.replace('<@U06D5B8AR8R>', '')}")

    # Formulate the conversation context
    conversation_context = "\n\n".join(conversation_history[thread_ts]) + "\n\nAssistant:"

    msg = call_bedrock(conversation_context)
    
    # Add the assistant's response to the conversation history
    conversation_history[thread_ts].append(f"Assistant: {msg}")

    # Log the values
    logger.info(f"Slack Text: {slackText}")
    logger.info(f"Slack User: {slackUser}")
    logger.info(f"Channel: {channel}")
    logger.info(f"Thread TS: {thread_ts}")
    logger.info(f"Message: {msg}")
    
    data = {
        'channel': channel, 
        'text': f"<@{slackUser}> {msg}",
        'thread_ts': thread_ts  # Include the thread timestamp
    }
    
    headers = {
        'Authorization': f'Bearer {slackToken}',
        'Content-Type': 'application/json',
    }

    try:
        response = http.request('POST', slackUrl, headers=headers, body=json.dumps(data))
        # Log the response from Slack
        logger.info(f"Slack Response: {response.data.decode('utf-8')}")
    except Exception as e:
        logger.error(f"Error sending message to Slack: {e}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({'msg': "message received"})
    }

