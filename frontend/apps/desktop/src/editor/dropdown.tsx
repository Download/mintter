import {
  ButtonProps,
  YStack,
  SizableText,
  SizableTextProps,
  ListItem,
  useTheme,
} from '@mintter/ui'
import {Button} from '@mintter/ui'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import {forwardRef} from 'react'

// export const dropdownContentStyle = css({
//   minWidth: 220,
//   background: '$base-background-subtle',
//   boxShadow: '$menu',
//   borderRadius: '$2',
//   overflow: 'hidden',
//   zIndex: '$max',
// })

const Content = ({
  children,
  ...props
}: DropdownMenuPrimitive.DropdownMenuContentProps) => {
  return (
    <DropdownMenuPrimitive.Content asChild {...props}>
      <YStack
        //@ts-ignore
        contentEditable={false}
        minWidth={220}
        elevation="$5"
        backgroundColor="$background"
        borderRadius="$3"
        overflow="hidden"
        zIndex="$max"
      >
        {children}
      </YStack>
    </DropdownMenuPrimitive.Content>
  )
}

const SubContent = ({
  children,
  ...props
}: DropdownMenuPrimitive.DropdownMenuSubContentProps) => {
  return (
    <DropdownMenuPrimitive.SubContent asChild {...props}>
      <YStack
        //@ts-ignore
        contentEditable={false}
        minWidth={300}
        elevation="$7"
        backgroundColor="$background"
        borderRadius="$3"
        overflow="hidden"
        zIndex="$max"
      >
        {children}
      </YStack>
    </DropdownMenuPrimitive.SubContent>
  )
}

var RightSlot = SizableText

export const ElementDropdown = forwardRef((props: ButtonProps, ref: any) => {
  return (
    <DropdownMenuPrimitive.Trigger asChild ref={ref}>
      <Button size="$2" {...props} />
    </DropdownMenuPrimitive.Trigger>
  )
})

export const SubTrigger = forwardRef((props: SizableTextProps, ref: any) => {
  return (
    <DropdownMenuPrimitive.SubTrigger asChild ref={ref}>
      <SizableText
        outlineStyle="none"
        backgroundColor="$background"
        paddingHorizontal="$4"
        paddingVertical="$2"
        outlineColor="transparent"
        {...props}
        // onPress={props.onSelect}
      />
    </DropdownMenuPrimitive.SubTrigger>
  )
})

function Label(props: SizableTextProps) {
  return (
    <DropdownMenuPrimitive.Label asChild>
      <SizableText
        outlineStyle="none"
        backgroundColor="$background"
        size="$1"
        paddingHorizontal="$4"
        outlineColor="transparent"
        {...props}
      />
    </DropdownMenuPrimitive.Label>
  )
}

function Item({children, title, icon, iconAfter, disabled, ...props}: any) {
console.log('ITEM', props)

  return (
    <DropdownMenuPrimitive.Item {...props} disabled={disabled} asChild>
      <ListItem
        hoverTheme
        pressTheme
        focusTheme
        paddingVertical="$2"
        paddingHorizontal="$4"
        textAlign="left"
        outlineColor="transparent"
        space="$2"
        opacity={disabled ? 0.5 : 1}
        userSelect="none"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        title={
          title ? (
            <SizableText
              fontSize="600"
              cursor={disabled ? 'not-allowed' : 'pointer'}
              userSelect="none"
            >
              {title}
            </SizableText>
          ) : undefined
        }
        icon={icon}
        iconAfter={iconAfter}
      >
        {children}
      </ListItem>
    </DropdownMenuPrimitive.Item>
  )
}

export const Dropdown = {
  ...DropdownMenuPrimitive,
  // Content,
  Trigger: ElementDropdown,
  Label,
  Content,
  SubContent,
  Item,

  SubTrigger,
  // Separator: StyledSeparator,
  RightSlot,
}

// export var ElementDropdown = styled('button', {
//   all: 'unset',
//   zIndex: 10,
//   padding: 0,
//   blockSize: '1.2rem',
//   inlineSize: '1.2rem',
//   borderRadius: '$2',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   '&:hover': {
//     cursor: 'pointer',
//     backgroundColor: '$base-component-bg-normal',
//   },
// })
