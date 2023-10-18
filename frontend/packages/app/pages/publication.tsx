import {AppBanner, BannerText} from '@mintter/app/components/app-banner'
import {AppError} from '@mintter/app/components/app-error'
import {CitationsAccessory} from '@mintter/app/components/citations'
import {CitationsProvider} from '@mintter/app/components/citations-context'
import Footer, {FooterButton} from '@mintter/app/components/footer'
import {useDocChanges} from '@mintter/app/models/changes'
import {useDocCitations} from '@mintter/app/models/content-graph'
import {useNavRoute} from '@mintter/app/utils/navigation'
import {useNavigate} from '@mintter/app/utils/useNavigate'
import {
  BACKEND_FILE_URL,
  MttLink,
  StaticPublication,
  StaticPublicationProvider,
  pluralS,
  unpackDocId,
} from '@mintter/shared'
import {Button, Link, MainWrapper, Text, XStack, YStack} from '@mintter/ui'
import {History} from '@tamagui/lucide-icons'
import {Allotment} from 'allotment'
import 'allotment/dist/style.css'
import {ErrorBoundary} from 'react-error-boundary'
import {EntityVersionsAccessory} from '../components/changes-list'
import {
  StaticBlockAccount,
  StaticBlockGroup,
  StaticBlockPublication,
} from '../components/static-embeds'
import {VersionChangesInfo} from '../components/version-changes-info'
import {usePublicationInContext} from '../models/publication'
import {useOpenUrl} from '../open-url'
import {DocumentPlaceholder} from './document-placeholder'
import {useAppContext} from '../app-context'
import {useFullReferenceUrl} from '../components/titlebar/common'
import {copyUrlToClipboardWithFeedback} from '../copy-to-clipboard'

export function AppStaticPublicationProvider({
  children,
}: React.PropsWithChildren<{}>) {
  const {saveCidAsFile} = useAppContext()
  const openUrl = useOpenUrl()
  const route = useNavRoute()
  const reference = useFullReferenceUrl(route)
  return (
    <StaticPublicationProvider
      entityComponents={{
        StaticAccount: StaticBlockAccount,
        StaticGroup: StaticBlockGroup,
        StaticPublication: StaticBlockPublication,
      }}
      onLinkClick={(href, e) => {
        e.preventDefault()
        e.stopPropagation()
        openUrl(href)
      }}
      onCopyBlock={(blockId: string) => {
        if (blockId && reference?.url) {
          const url = `${reference.url}#${blockId}`
          copyUrlToClipboardWithFeedback(url, reference?.label)
        }
      }}
      ipfsBlobPrefix={`${BACKEND_FILE_URL}/`}
      saveCidAsFile={saveCidAsFile}
    >
      {children}
    </StaticPublicationProvider>
  )
}

export default function PublicationPage() {
  const route = useNavRoute()
  const openUrl = useOpenUrl()
  if (route.key !== 'publication')
    throw new Error('Publication page expects publication actor')

  const docId = route?.documentId
  const accessory = route?.accessory
  const accessoryKey = accessory?.key
  const replace = useNavigate('replace')
  if (!docId)
    throw new Error(
      `Publication route does not contain docId: ${JSON.stringify(route)}`,
    )
  const publication = usePublicationInContext({
    documentId: docId,
    versionId: route.versionId,
    pubContext: route.pubContext,
  })

  const {data: changes} = useDocChanges(
    publication.status == 'success' ? docId : undefined,
  )
  const {data: citations} = useDocCitations(
    publication.status == 'success' ? docId : undefined,
  )
  const {saveCidAsFile} = useAppContext()
  if (publication.data) {
    return (
      <ErrorBoundary
        FallbackComponent={AppError}
        onReset={() => publication.refetch()}
      >
        <CitationsProvider
          documentId={docId}
          onCitationsOpen={(citations: Array<MttLink>) => {
            // todo, pass active citations into route
            replace({...route, accessory: {key: 'citations'}})
          }}
        >
          <Allotment
            key={`${accessory}`}
            defaultSizes={accessory ? [65, 35] : [100]}
          >
            <Allotment.Pane>
              <YStack height="100%">
                <MainWrapper>
                  <YStack
                    paddingVertical={80}
                    width="100%"
                    maxWidth="calc(90ch + 20vw)"
                    paddingHorizontal="10vw"
                    alignSelf="center"
                  >
                    <AppStaticPublicationProvider>
                      <StaticPublication publication={publication.data} />
                    </AppStaticPublicationProvider>
                  </YStack>
                  {route.versionId && (
                    <OutOfDateBanner docId={docId} version={route.versionId} />
                  )}
                </MainWrapper>
              </YStack>
            </Allotment.Pane>
            {accessoryKey &&
              (accessoryKey == 'versions' ? (
                <EntityVersionsAccessory
                  id={unpackDocId(docId)}
                  activeVersion={publication.data.version}
                />
              ) : (
                <CitationsAccessory docId={docId} />
              ))}
          </Allotment>
          <Footer>
            <XStack gap="$3" marginHorizontal="$3">
              {publication.data?.version && (
                <VersionChangesInfo version={publication.data?.version} />
              )}
            </XStack>

            <FooterButton
              active={accessoryKey === 'versions'}
              label={`${changes?.changes?.length} ${pluralS(
                changes?.changes?.length,
                'Version',
              )}`}
              icon={History}
              onPress={() => {
                if (route.accessory?.key === 'versions')
                  return replace({...route, accessory: null})
                replace({...route, accessory: {key: 'versions'}})
              }}
            />

            {citations?.links?.length ? (
              <FooterButton
                active={accessoryKey === 'citations'}
                label={`${citations?.links?.length} ${pluralS(
                  citations?.links?.length,
                  'Citation',
                )}`}
                icon={Link}
                onPress={() => {
                  if (route.accessory?.key === 'citations')
                    return replace({...route, accessory: null})
                  replace({...route, accessory: {key: 'citations'}})
                }}
              />
            ) : null}
          </Footer>
        </CitationsProvider>
      </ErrorBoundary>
    )
  }

  if (publication.error) {
    return (
      <YStack>
        <YStack gap="$3" alignItems="flex-start" maxWidth={500} padding="$8">
          <Text fontFamily="$body" fontWeight="700" fontSize="$6">
            Publication ERROR
          </Text>
          <Text fontFamily="$body" fontSize="$4">
            {JSON.stringify(publication.error)}
          </Text>
          <Button theme="yellow" onPress={() => publication.refetch()}>
            try again
          </Button>
        </YStack>
      </YStack>
    )
  }

  return <DocumentPlaceholder />
}

function OutOfDateBanner({docId, version}: {docId: string; version: string}) {
  const route = useNavRoute()
  const pubRoute = route.key === 'publication' ? route : undefined
  const pubContext = pubRoute?.pubContext
  const pub = usePublicationInContext({documentId: docId, pubContext})

  const navigate = useNavigate()
  const pubAccessory = route.key === 'publication' ? route.accessory : undefined
  if (pub.isLoading) return null
  if (version === pub?.data?.version) return null
  if (pub?.data?.version) return null
  return (
    <AppBanner
      onPress={() => {
        navigate({
          key: 'publication',
          documentId: docId,
          accessory: pubAccessory,
          pubContext,
        })
      }}
    >
      <BannerText>
        There is a newer{' '}
        {pubContext?.key === 'trusted' ? 'trusted version' : 'version'} of this
        Publication{pubContext?.key === 'group' ? ' in this group' : ''}. Click
        here to go to latest →
      </BannerText>
    </AppBanner>
  )
}

function usePublicationCitations(docId?: string) {
  return useDocCitations(docId)
}