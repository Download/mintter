import {
  GetServerSideProps,
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from 'next'
import PublicationPage from '../../ssr-publication-page'
import {impatiently} from 'server/impatiently'
import {getPageProps, serverHelpers} from 'server/ssr-helpers'
import {useRequiredRouteQuery, useRouteQuery} from 'server/router-queries'

export default function IDPublicationPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  return (
    <PublicationPage
      documentId={useRequiredRouteQuery('cid')}
      version={useRouteQuery('v')}
    />
  )
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const {params, query} = context
  let cid = params?.cid ? String(params.cid) : undefined
  let version = query.v ? String(query.v) : null
  if (!cid) return {notFound: true}

  const helpers = serverHelpers({})

  await impatiently(
    helpers.publication.get.prefetch({
      documentId: cid,
      versionId: version || undefined,
    }),
  )

  return {
    props: await getPageProps(helpers, {}),
  }
}
