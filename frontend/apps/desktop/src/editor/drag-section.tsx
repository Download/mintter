import {features} from '@app/constants'
import {useDrag} from '@app/drag-context'
import {useCitationsForBlock} from '@app/editor/comments/citations-context'
import {EditorMode} from '@app/editor/plugin-utils'
import {useMouse} from '@app/mouse-context'
import {Button} from '@components/button'
import {ConversationBlockBubble} from '@components/conversation-block-bubble'
import {Icon} from '@components/icon'
import {Text} from '@components/text'
import {FlowContent} from '@mintter/shared'
import React, {useContext} from 'react'
import {RenderElementProps, useSlate} from 'slate-react'
import {BlockTools} from './blocktools'
import DragContext from './drag-context'
import {useBlockProps} from './editor-node-props'
import {useBlockFlash} from './utils'

export type DndState = {fromPath: number[] | null; toPath: number[] | null}

export const ElementDrag = ({
  children,
  element,
  attributes,
}: RenderElementProps) => {
  let dragService = useDrag()
  let mouseService = useMouse()
  let editor = useSlate()

  const onDrop = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault()
    mouseService.send('DISABLE.DRAG.END')
    dragService?.send({
      type: 'DROPPED',
    })

    e.dataTransfer?.clearData()
  }

  //@ts-ignore
  let {blockProps} = useBlockProps(element)

  let inRoute = useBlockFlash(attributes.ref, (element as FlowContent).id)

  const dragContext = useContext(DragContext)
  const {drag, setDrag, clearDrag} = dragContext

  return (
    <li
      {...attributes}
      {...blockProps}
      className={inRoute ? 'flash' : undefined}
      onDrop={editor.mode == EditorMode.Draft ? onDrop : undefined}
      onDragEnd={editor.mode == EditorMode.Draft ? onDrop : undefined}
      onDragOver={(e: any) => {
        if (drag) return
        setDrag(e, element as FlowContent)
      }}
      onDragLeave={(e: any) => {
        if (!drag) return
        clearDrag()
      }}
    >
      <BlockTools block={element as FlowContent} />
      {children}
      {editor.mode == EditorMode.Publication ? (
        <span contentEditable={false}>
          {features.comments ? (
            <ConversationBlockBubble block={element as FlowContent} />
          ) : null}
          {editor.mode == EditorMode.Publication ? (
            <CitationNumber block={element as FlowContent} />
          ) : null}
        </span>
      ) : null}
    </li>
  )
}

function CitationNumber({block}: {block: FlowContent}) {
  let {citations = [], onCitationsOpen} = useCitationsForBlock(block.id)

  return citations?.length ? (
    <Button
      onClick={(e) => {
        e.preventDefault()
        onCitationsOpen(citations)
      }}
      color="muted"
      variant="ghost"
      size="0"
      contentEditable={false}
      css={{
        userSelect: 'none',
        position: 'absolute',
        top: 32,
        right: -54,
        display: 'flex',
        alignItems: 'center',
        gap: '$2',
        paddingInline: '$3',
        paddingBlock: '$1',
        // borderRadius: '$2',
        zIndex: '$max',
        '&:hover': {
          backgroundColor: '$base-component-bg-hover',
          cursor: 'pointer',
        },
      }}
    >
      <Icon name="ArrowTopRight" size="2" color="muted" />
      <Text
        size="2"
        color="muted"
        css={{
          '&:hover': {
            color: '$base-text-low',
          },
        }}
      >
        {citations.length}
      </Text>
    </Button>
  ) : null
}