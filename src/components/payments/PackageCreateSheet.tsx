import { useState } from 'react'
import { toast } from 'sonner'
import { useCallable } from '@/hooks/useCallable'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PackageCreateSheetProps {
  clientId: string
  open: boolean
  onClose: () => void
}

interface CreatePackageInput {
  clientId: string
  type: 'private' | 'group'
  totalCredits: number
}

interface CreatePackageOutput {
  id: string
}

const CREDIT_PRESETS = [1, 5, 10, 20]

export function PackageCreateSheet({ clientId, open, onClose }: PackageCreateSheetProps) {
  const [packageType, setPackageType] = useState<'private' | 'group'>('private')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(10)
  const [customCredits, setCustomCredits] = useState('')

  const { call, loading, error } = useCallable<CreatePackageInput, CreatePackageOutput>(
    'createPackage'
  )

  const totalCredits = customCredits
    ? parseInt(customCredits, 10)
    : selectedPreset ?? 0

  async function handleCreate() {
    if (!totalCredits || totalCredits <= 0) {
      toast.error('Please select or enter a credit amount.')
      return
    }

    const result = await call({ clientId, type: packageType, totalCredits })

    if (result) {
      toast.success(`${totalCredits}-session ${packageType} package created`)
      handleClose()
    }
  }

  function handleClose() {
    setPackageType('private')
    setSelectedPreset(10)
    setCustomCredits('')
    onClose()
  }

  function handlePresetClick(preset: number) {
    setSelectedPreset(preset)
    setCustomCredits('')
  }

  function handleCustomChange(val: string) {
    setCustomCredits(val)
    setSelectedPreset(null)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <SheetContent side="bottom" className="rounded-t-xl pb-safe">
        <SheetHeader>
          <SheetTitle>Create Package</SheetTitle>
        </SheetHeader>

        <div className="px-4 space-y-5 pb-2">
          {/* Type toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Package Type
            </Label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['private', 'group'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPackageType(t)}
                  className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                    packageType === t
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-foreground hover:bg-secondary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Credit presets */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Sessions
            </Label>
            <div className="flex gap-2">
              {CREDIT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedPreset === preset
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-secondary'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div className="space-y-1.5">
            <Label htmlFor="custom-credits" className="text-xs text-muted-foreground uppercase tracking-wide">
              Custom Amount
            </Label>
            <Input
              id="custom-credits"
              type="number"
              min="1"
              placeholder="Enter number of sessions"
              value={customCredits}
              onChange={(e) => handleCustomChange(e.target.value)}
              onFocus={() => setSelectedPreset(null)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <SheetFooter className="px-4">
          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={loading || !totalCredits || totalCredits <= 0}
          >
            {loading ? 'Creating...' : 'Create Package'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
