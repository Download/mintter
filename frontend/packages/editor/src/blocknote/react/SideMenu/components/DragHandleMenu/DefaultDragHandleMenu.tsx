import {BlockSchema} from '@/blocknote/core'

import {RemoveBlockButton} from './DefaultButtons/RemoveBlockButton'
import {DragHandleMenu, DragHandleMenuProps} from './DragHandleMenu'

export const DefaultDragHandleMenu = <BSchema extends BlockSchema>(
  props: DragHandleMenuProps<BSchema>,
) => (
  <DragHandleMenu>
    <RemoveBlockButton {...props}>Delete</RemoveBlockButton>
    {/* <BlockColorsButton {...props}>Colors</BlockColorsButton> */}
  </DragHandleMenu>
)
