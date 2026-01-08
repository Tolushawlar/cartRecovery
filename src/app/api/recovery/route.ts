import { NextRequest, NextResponse } from 'next/server'
import { cartRecoveryService } from '@/lib/cart-recovery'

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const processAll = url.searchParams.get('processAll')
    
    if (processAll === 'true') {
      console.log('Processing all existing webhook calls...')
      await cartRecoveryService.processAllWebhookCalls()
    }
    
    console.log('Processing scheduled recovery calls...')
    await cartRecoveryService.processScheduledCalls()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Scheduled calls processed successfully' 
    })
  } catch (error) {
    console.error('Error processing scheduled calls:', error)
    return NextResponse.json({ 
      error: 'Failed to process scheduled calls' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const date = url.searchParams.get('date')
    
    const stats = await cartRecoveryService.getDailyStats(date || undefined)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching recovery stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stats' 
    }, { status: 500 })
  }
}