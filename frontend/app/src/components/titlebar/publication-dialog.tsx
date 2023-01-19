import {useMain} from '@app/main-context'
import {styled} from '@app/stitches.config'
import {Button} from '@components/button'
import {dialogContentStyles, overlayStyles} from '@components/dialog-styles'
import {TextField} from '@components/text-field'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {useMemo, useState} from 'react'

const StyledOverlay = styled(DialogPrimitive.Overlay, overlayStyles)
const StyledContent = styled(DialogPrimitive.Content, dialogContentStyles)

function writePathState(s: string) {
  return s.replace(/[^a-z0-9]/gi, '_')
}
function readPathState(s: string) {
  return s.replace(/_+$/, '')
}
const Heading = styled('h2', {
  margin: 0,
  fontSize: '$4',
})
function PublishDialogForm({
  siteId,
  docId,
  onDone,
}: {
  siteId: string
  docId?: string
  onDone?: () => void
}) {
  const main = useMain()
  const init = useMemo(() => {
    const doc = main.getSnapshot().context.current
    const docState = doc?.getSnapshot()
    const title = docState?.context.title
    const path = title ? writePathState(title) : 'untitled'

    return {path, docId: docState?.context.documentId}
  }, [])
  const [path, setPath] = useState<string>(init.path)

  return (
    <>
      <Heading>Publish to {siteId}</Heading>
      <TextField
        placeholder={'Unlisted Document'}
        id="pretty-path"
        name="pretty-path"
        label="Public URL (/Path)"
        value={path}
        onChange={(e) => {
          setPath(writePathState(e.target.value))
        }}
      />
      <URLPreview>
        https://{siteId}/{path === '' ? `p/${init.docId}` : readPathState(path)}
      </URLPreview>
      <Button
        onClick={() => {
          onDone?.()
        }}
      >
        Publish Document
      </Button>
    </>
  )
}
export function usePublicationDialog(docId?: string) {
  const [openSiteId, setOpenSiteId] = useState<null | string>(null)
  function open(siteId: string) {
    setOpenSiteId(siteId)
  }
  return {
    content: (
      <DialogPrimitive.Root
        open={!!openSiteId}
        onOpenChange={(isOpen) => {
          if (!isOpen) setOpenSiteId(null)
        }}
      >
        <DialogPrimitive.Portal>
          <StyledOverlay />
          <StyledContent>
            {openSiteId && (
              <PublishDialogForm
                docId={docId}
                siteId={openSiteId}
                onDone={() => {
                  setOpenSiteId(null)
                }}
              />
            )}
          </StyledContent>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    ),
    open,
  }
}

const URLPreview = styled('p', {
  color: '$success-text-low',
})