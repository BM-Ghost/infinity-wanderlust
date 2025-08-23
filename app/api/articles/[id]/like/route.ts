import { NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
import { auth } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const pb = getPocketBase()
    
    // Check if user already liked the article
    const existingLike = await pb.collection('article_likes').getFirstListItem(
      `article = "${params.id}" && user = "${session.user.id}"`
    ).catch(() => null)

    if (existingLike) {
      // Unlike the article
      await pb.collection('article_likes').delete(existingLike.id)
      
      // Decrement likes count
      const article = await pb.collection('articles').getOne(params.id)
      await pb.collection('articles').update(params.id, {
        likes_count: (article.likes_count || 0) - 1
      })
      
      return NextResponse.json({ liked: false })
    } else {
      // Like the article
      await pb.collection('article_likes').create({
        article: params.id,
        user: session.user.id,
      })
      
      // Increment likes count
      const article = await pb.collection('articles').getOne(params.id)
      await pb.collection('articles').update(params.id, {
        likes_count: (article.likes_count || 0) + 1
      })
      
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Error toggling article like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
