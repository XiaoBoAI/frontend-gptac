import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/i18n'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { IconPencil, IconX } from '@tabler/icons-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface EditMessageDialogProps {
  message: string
  imageUrls?: string[]
  onSave: (message: string, imageUrls?: string[]) => void
  triggerElement?: React.ReactNode
}

export function EditMessageDialog({
  message,
  imageUrls,
  onSave,
  triggerElement,
}: EditMessageDialogProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(message)
  const [keptImages, setKeptImages] = useState<string[]>(imageUrls || [])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(message)
    setKeptImages(imageUrls || [])
  }, [message, imageUrls])

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      }, 100)
    }
  }, [isOpen])

  const handleSave = () => {
    const hasTextChanged = draft !== message && draft.trim()
    const hasImageChanged =
      JSON.stringify(imageUrls || []) !== JSON.stringify(keptImages)

    if (hasTextChanged || hasImageChanged) {
      onSave(
        draft.trim() || message,
        keptImages.length > 0 ? keptImages : undefined
      )
      setIsOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    }
  }

  const defaultTrigger = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="flex outline-0 items-center gap-1 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group relative bg-transparent border-none p-0"
          onClick={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsOpen(true)
            }
          }}
        >
          <IconPencil size={16} />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t('common.edit')}</p>
      </TooltipContent>
    </Tooltip>
  )

  return (
    <>
      {triggerElement || defaultTrigger}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[900px] gap-0 p-8">
          <DialogHeader className="space-y-3 pr-8 mb-6">
            <DialogTitle className="text-2xl font-semibold">{t('common.dialogs.editMessage.title')}</DialogTitle>
          </DialogHeader>
          {keptImages.length > 0 && (
            <div className="mb-6">
              <div className="flex gap-3 flex-wrap">
                {keptImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative border border-gray-200 dark:border-slate-600 rounded-lg w-14 h-14"
                  >
                    <img
                      className="object-cover w-full h-full rounded-lg"
                      src={imageUrl}
                      alt={`附加图片 ${index + 1}`}
                    />
                    <div
                      className="absolute -top-1 -right-2.5 bg-red-600 w-5 h-5 flex rounded-full items-center justify-center cursor-pointer hover:bg-red-700 transition-colors"
                      onClick={() =>
                        setKeptImages((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <IconX className="text-white" size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full min-h-[160px] text-base"
              onKeyDown={handleKeyDown}
              placeholder={t('common.dialogs.editMessage.title')}
              aria-label={t('common.dialogs.editMessage.title')}
            />
          </div>
          <DialogFooter className="mt-8 gap-3">
            <DialogClose asChild>
              <Button
                variant="outline"
                size="default"
                className="px-6 border-none bg-transparent hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200"
              >
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              disabled={
                draft === message &&
                JSON.stringify(imageUrls || []) ===
                  JSON.stringify(keptImages) &&
                !draft.trim()
              }
              onClick={handleSave}
              size="default"
              className="px-6 border-none bg-[#E8532F] hover:bg-[#F06540] dark:bg-[#D14A29] dark:hover:bg-[#E75C34] text-white transition-all duration-200 ease-out transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
