'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { X, Loader2 } from 'lucide-react'

type ArticleFormProps = {
  initialData?: {
    id?: string
    title: string
    content: string
    excerpt: string
    tags: string[]
    featured_image?: string | null
  } | null
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEdit ? 'Updating...' : 'Publishing...'}
        </>
      ) : isEdit ? (
        'Update Article'
      ) : (
        'Publish Article'
      )}
    </Button>
  )
}

export function ArticleForm({ initialData }: ArticleFormProps) {
  const router = useRouter()
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [isImageUploading, setIsImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(
    initialData?.featured_image 
      ? `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/articles/${initialData.id}/${initialData.featured_image}`
      : null
  )
  
  const isEdit = !!initialData?.id
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const excerpt = formData.get('excerpt') as string
    const content = formData.get('content') as string
    const featuredImage = formData.get('featured_image') as File | null
    
    try {
      const data = new FormData()
      data.append('title', title)
      data.append('excerpt', excerpt)
      data.append('content', content)
      data.append('tags', JSON.stringify(tags))
      
      if (featuredImage && featuredImage.size > 0) {
        data.append('featured_image', featuredImage)
      } else if (initialData?.featured_image && !featuredImage) {
        // If there was an image but it was removed
        data.append('featured_image', '')
      }
      
      const url = isEdit 
        ? `/api/articles/${initialData.id}`
        : '/api/articles'
      
      const method = isEdit ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        body: data,
      })
      
      if (!response.ok) {
        throw new Error('Failed to save article')
      }
      
      const result = await response.json()
      
      toast({
        title: 'Success',
        description: isEdit 
          ? 'Article updated successfully!' 
          : 'Article published successfully!',
      })
      
      router.push(`/articles/${isEdit ? initialData.id : result.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error saving article:', error)
      toast({
        title: 'Error',
        description: 'Failed to save article. Please try again.',
        variant: 'destructive',
      })
    }
  }
  
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const value = tagInput.trim()
      
      if (value && !tags.includes(value)) {
        setTags([...tags, value])
        setTagInput('')
      }
    }
  }
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const removeImage = () => {
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={initialData?.title || ''}
          placeholder="Enter article title"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          defaultValue={initialData?.excerpt || ''}
          placeholder="A short summary of your article"
          className="min-h-[100px]"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          defaultValue={initialData?.content || ''}
          placeholder="Write your article content here..."
          className="min-h-[300px] font-mono text-sm"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label>Featured Image</Label>
        {previewImage ? (
          <div className="relative group">
            <div className="relative aspect-video w-full max-w-2xl rounded-md overflow-hidden">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-md p-6 text-center">
            <input
              type="file"
              id="featured_image"
              name="featured_image"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <Label
              htmlFor="featured_image"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Upload Image
            </Label>
            <p className="mt-2 text-sm text-muted-foreground">
              Recommended size: 1200x630px
            </p>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-primary/70 hover:bg-primary/20 hover:text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <Input
          id="tags"
          placeholder="Add tags (press Enter or , to add)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={(e) => {
            const value = e.target.value.trim()
            if (value && !tags.includes(value)) {
              setTags([...tags, value])
              setTagInput('')
            }
          }}
        />
      </div>
      
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
