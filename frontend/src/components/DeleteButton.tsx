import { useEffect, useId, useRef, useState } from 'react'

type DeleteButtonProps = {
  label?: string
  title: string
  description: string
  disabled: boolean
  onDelete: () => Promise<boolean>
}

export function DeleteButton({
  label = 'Delete',
  title,
  description,
  disabled,
  onDelete,
}: DeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const element = dialog.current
    if (isOpen) element?.showModal()
    return () => {
      element?.close()
    }
  }, [isOpen])

  async function confirmDelete() {
    // Close first so API errors remain visible in the page and focus is restored.
    setIsOpen(false)
    await onDelete()
  }

  return (
    <>
      <button
        className="Button ButtonDanger"
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        {label}
      </button>
      <dialog
        className="ConfirmDialog"
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={() => setIsOpen(false)}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="FormActions">
          <button
            className="Button ButtonSecondary"
            type="button"
            autoFocus
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
          <button
            className="Button ButtonDanger"
            type="button"
            disabled={disabled}
            onClick={() => void confirmDelete()}
          >
            {label}
          </button>
        </div>
      </dialog>
    </>
  )
}
