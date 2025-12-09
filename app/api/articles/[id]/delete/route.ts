import { NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { useAuth } from '@/lib/auth'
export const runtime = "edge";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await useAuth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const pb = getPocketBase()
    
    // Get the article to check ownership
    const article = await pb.collection('articles').getOne(params.id)
    
    // Only allow the author or admin to delete
    if (article.author !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
    
    // Delete the article
    await pb.collection('articles').delete(params.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}
