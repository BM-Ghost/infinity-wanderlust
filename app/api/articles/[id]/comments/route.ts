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

    const { content } = await request.json()
    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    const pb = getPocketBase()
    
    // Create the comment
    await pb.collection('article_comments').create({
      article: params.id,
      user: session.user.id,
      content: content.trim(),
    })
    
    // Increment comments count
    const article = await pb.collection('articles').getOne(params.id)
    await pb.collection('articles').update(params.id, {
      comments_count: (article.comments_count || 0) + 1
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
