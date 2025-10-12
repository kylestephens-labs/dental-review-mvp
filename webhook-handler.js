exports.handler = async (event) => {
    console.log('Webhook received:', JSON.stringify(event, null, 2));
    
    // Extract data from the webhook
    const body = event.body ? JSON.parse(event.body) : {};
    
    // Forward to your automation system
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://automation.serviceboost.co';
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source: 'dental-landing-page',
                timestamp: new Date().toISOString(),
                data: body
            })
        });
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify({
                success: true,
                message: 'Webhook processed successfully'
            })
        };
    } catch (error) {
        console.error('Error processing webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error'
            })
        };
    }
};
