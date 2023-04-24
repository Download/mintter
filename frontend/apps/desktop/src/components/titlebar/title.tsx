import {useDraft, useDraftTitle, usePublication} from '@app/models/documents'
import {useAccount} from '@app/models/accounts'
import {
  DraftRoute,
  PublicationRoute,
  useNavRoute,
  useNavigate,
} from '@app/utils/navigation'
import {hostnameStripProtocol} from '@app/utils/site-hostname'
import {
  ButtonText,
  SizeTokens,
  TitleText,
  XStack,
  File,
  User,
  Pencil,
} from '@mintter/ui'
import {AccountLinkAvatar} from '@components/account-link-avatar'

export function TitleContent({size = '$4'}: {size?: SizeTokens}) {
  const route = useNavRoute()
  if (route.key === 'home') {
    return (
      <>
        <File size={12} />
        <TitleText data-tauri-drag-region size={size}>
          All Publications
        </TitleText>
      </>
    )
  }
  if (route.key === 'connections') {
    return (
      <>
        <User size={12} />
        <TitleText data-tauri-drag-region size={size}>
          Connections
        </TitleText>
      </>
    )
  }
  if (route.key === 'drafts') {
    return (
      <>
        <Pencil size={12} />
        <TitleText data-tauri-drag-region size={size}>
          Drafts
        </TitleText>
      </>
    )
  }
  if (route.key === 'account') {
    return <TitleText size={size}>Account Profile</TitleText>
  }
  if (route.key === 'site') {
    return (
      <TitleText data-tauri-drag-region size={size}>
        {hostnameStripProtocol(route.hostname)}
      </TitleText>
    )
  }
  if (route.key === 'publication') {
    return <PublicationTitle route={route} />
  }
  if (route.key === 'draft') {
    return <DraftTitle route={route} />
  }
  return null
}

export function Title({size}: {size?: SizeTokens}) {
  return (
    <XStack
      gap="$2"
      alignItems="center"
      margin="auto"
      marginVertical={0}
      data-tauri-drag-region
    >
      <TitleContent size={size} />
    </XStack>
  )
}

function PublicationTitle({
  route,
  size = '$4',
}: {
  route: PublicationRoute
  size?: SizeTokens
}) {
  let {data: pub} = usePublication({
    documentId: route.documentId,
    versionId: route.versionId,
  })
  return (
    <>
      <TitleText size={size}>{pub?.document?.title || '...'}</TitleText>
      <XStack gap={0}>
        {pub?.document?.editors.length === 0 ? (
          <AccountLinkAvatar accountId={pub?.document?.author} />
        ) : (
          pub?.document?.editors.map((editor) => (
            <AccountLinkAvatar accountId={editor} key={editor} />
          ))
        )}
      </XStack>
    </>
  )
}

function DraftTitle({
  route,
  size = '$4',
}: {
  route: DraftRoute
  size?: SizeTokens
}) {
  const title = useDraftTitle({
    documentId: route.documentId,
  })
  const displayTitle = title ?? 'Untitled Draft'
  return (
    <>
      <Pencil size={12} />
      <TitleText size={size}>{displayTitle}</TitleText>
    </>
  )
}
