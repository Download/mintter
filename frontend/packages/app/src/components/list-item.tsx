import {FC, ReactElement, useState} from 'react'
import {usePopoverState} from '../use-popover-state'
import {
  Button,
  ButtonText,
  MoreHorizontal,
  Popover,
  Separator,
  YGroup,
} from '@mintter/ui'
import {GestureResponderEvent, GestureResponderHandlers} from 'react-native'
import {MenuItem} from './dropdown'
import {formattedDate} from '@mintter/shared'
import {Timestamp} from '@bufbuild/protobuf'

export type MenuItem = {
  key: string
  label: string
  icon: FC
  onPress: () => void
}

export function ListItem({
  accessory,
  title,
  onPress,
  onPrefetch,
  menuItems = [],
}: {
  accessory: ReactElement
  title: string
  onPress: (e: GestureResponderEvent) => void
  onPrefetch?: () => void
  menuItems?: MenuItem[]
}) {
  // const [isHovering, setIsHovering] = useState(false)
  const popoverState = usePopoverState()
  return (
    <>
      <Button
        onPointerEnter={() => {
          // setIsHovering(true)
          onPrefetch?.()
        }}
        // onPointerLeave={() => setIsHovering(false)}
        chromeless
        tag="li"
      >
        <ButtonText onPress={onPress} fontWeight="700" flex={1}>
          {title}
        </ButtonText>
        {accessory}
        <Popover {...popoverState} placement="bottom-end">
          <Popover.Trigger asChild>
            <Button size="$1" circular data-trigger icon={MoreHorizontal} />
          </Popover.Trigger>
          <Popover.Content padding={0} elevation="$2">
            <YGroup separator={<Separator />}>
              {menuItems.map((item) => (
                <YGroup.Item key={item.key}>
                  <MenuItem
                    onPress={() => {
                      popoverState.onOpenChange(false)
                      item.onPress()
                    }}
                    title={item.label}
                    icon={item.icon}
                  />
                </YGroup.Item>
              ))}
            </YGroup>
          </Popover.Content>
        </Popover>
      </Button>
    </>
  )
}

export function TimeAccessory({
  time,
  onPress,
}: {
  time: Timestamp | undefined
  onPress: (e: GestureResponderEvent) => void
}) {
  return (
    <ButtonText
      fontFamily="$body"
      fontSize="$2"
      data-testid="list-item-date"
      minWidth="10ch"
      textAlign="right"
      onPress={onPress}
    >
      {time ? formattedDate(time) : '...'}
    </ButtonText>
  )
}