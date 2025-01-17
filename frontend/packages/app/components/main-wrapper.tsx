import {ScrollView, View, XStack, YStackProps, useStream} from '@mintter/ui'
import {SidebarWidth, useSidebarContext} from '../src/sidebar-context'

function SidebarSpacer() {
  const ctx = useSidebarContext()
  const isLocked = useStream(ctx.isLocked)
  const sidebarSpacing = isLocked ? SidebarWidth : 0
  return <View style={{maxWidth: sidebarSpacing, width: '100%'}} />
}

export function MainWrapper({children, ...props}: YStackProps & {}) {
  return (
    <XStack flex={1} {...props}>
      <SidebarSpacer />
      {/* TODO: we cannot remove this ID here because the SlashMenu is referencing
      this! */}
      <ScrollView id="scroll-page-wrapper">{children}</ScrollView>
    </XStack>
  )
}
