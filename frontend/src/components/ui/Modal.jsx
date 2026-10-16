// Accessible modal built on the native <dialog> element.
// showModal() gives us, for free: a backdrop, focus moved into the dialog,
// keyboard focus trapped inside it, and Escape to close.
import { useEffect, useId, useRef } from "react";
import { LuX } from "react-icons/lu";

export default function Modal({ open, onClose, title, description, children, size = "md" }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Escape fires "cancel"; let React state decide instead of closing directly.
  const handleCancel = (event) => {
    event.preventDefault();
    onClose();
  };

  // Clicking the dark backdrop (outside the panel) closes the dialog.
  const handleClick = (event) => {
    if (event.target === dialogRef.current) onClose();
  };

  const width = size === "sm" ? "max-w-md" : "max-w-lg";

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleClick}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-2xl bg-white p-0 text-ink shadow-xl`}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-ink">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-ink-2">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-m-1 rounded-lg p-1.5 text-ink-3 hover:bg-navy-50 hover:text-ink"
              aria-label="Close dialog"
            >
              <LuX className="size-5" aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
