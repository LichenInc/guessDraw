import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'
import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import schema from './schema.json'
const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData: schema
})
const cookieparser = require('cookieparser')
// configuration d'un apollo-link à la main https://vue-cli-plugin-apollo.netlify.com/guide/configuration.html
export default ({ req, app }) => {
  const endpoint = 'https://plus.dokoma.com/api/queries'
  const httpLink = new HttpLink({ uri: endpoint, credentials: 'include' })
  const middlewareLink = new ApolloLink((operation, forward) => {
    // const headersVal = {
    //   'Accept-Language': app.i18n.locale
    // }
    const headersVal = {}
    const source = process.server ? req.headers.cookie : document.cookie
    if (source) {
      const parsecook = cookieparser.parse(source)
      if (parsecook.drawtoken) {
        headersVal.Authorization = parsecook.drawtoken
      }
    }
    operation.setContext({
      headers: headersVal,
      uri: endpoint,
      credentials: 'include'
    })
    return forward(operation)
  })
  const link = middlewareLink.concat(httpLink)
  return {
    defaultHttpLink: false,
    link: link,
    cache: new InMemoryCache({ fragmentMatcher })
  }
}
