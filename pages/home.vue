<script>
import axios from 'axios'
import expression from '@/components/shared/expression'
import exercice from '@/components/shared/exercice'
export default {
  components: {
    expression,
    exercice
  },
  asyncData() {
    return {
      log: null,
      mdp: null,
      tokenExpire: false,
      goUser: false,
      errorConnexion: false,
      loading: false,
      getNode: false
    }
  },
  created() {
    if (this.$route.query.graph) {
      this.$store.commit('setCurrentGraph', this.$route.query.graph)
    } else {
      this.$store.commit('setCurrentGraph', '9ba5f372-b570-4bf4-bd55-b8bfe675b6b0')
    }
    if (this.$route.query.dokUANE && this.$route.query.access) {
      this.login(this.$route.query.dokUANE, this.$route.query.access)
    } else if (this.$cookies.get('drawtoken')) {
      this.goUser = true
    }
  },
  apollo: {
    graph: {
      query: require('@/apollo/queries/graph.gql'),
      variables() {
        if (this.$route.query.graph) {
          return {
            id: this.$route.query.graph
          }
        } else {
          return {
            id: '9ba5f372-b570-4bf4-bd55-b8bfe675b6b0'
          }
        }
      },
      update(data) {
        /* eslint-disable-next-line */
        console.log('graph data', data)
        this.$store.commit('setCurrentGraph', data.graph.id)
        if (!this.currentNode && data.graph.root_id) {
          this.currentNode = data.graph.root_id
        }
        if (data.graph.tag_visibles.length > 0) {
          data.graph.tag_visibles.forEach((elem) => {
            if (elem.name.toLowerCase() === 'introduction') {
              this.$store.commit('setStep', 'intro')
            } else if (elem.name.toLowerCase() === 'discussion') {
              this.$store.commit('setStep', 'conversation')
            }
          })
        }
        return data.graph
      },
      skip() {
        return !this.getNode
      }
    },
    node: {
      query: require('@/apollo/queries/getCurrentNode.gql'),
      variables() {
        return {
          graph_id: this.$store.state.currentGraph
        }
      },
      update(data) {
        return data.get_current_node
      },
      result({ data }) {
        /* eslint-disable-next-line */
        console.log('data node', data)
        this.$store.commit('setNode', data.get_current_node)
      },
      skip() {
        return !this.getNode
      }
    },
    user: {
      query: require('@/apollo/queries/user.graphql'),
      variables() {
        return {
          graph_id: this.$store.state.currentGraph
        }
      },
      result({ data }) {
        /* eslint-disable-next-line */
        console.log('data user', data)
        if (data && data.user && data.user.id) {
          this.userID = data.user.id
          this.checkAssign()
        } else {
          this.tokenExpire = true
        }
      },
      skip() {
        return !this.$cookies.get('drawtoken') && !this.goUser
      }
    }
  },
  methods: {
    login(usr, access) {
      this.$cookies.set('account', { user: usr, access_code: access })
      const thus = this
      try {
        this.errorConnexion = false
        this.loading = true
        // const thus = this
        axios.post('https://comptes.dokoma.com/api/v1/tokens.json?client_id=quizz&client_secret=dokoma', {
          user: { username: usr, access_code: access }
        }).then((response) => {
          if (response.errors) {
            this.loading = false
            this.errorConnexion = true
          } else {
            this.loading = false
            this.$store.commit('setLogin', usr)
            this.$store.commit('setPassword', access)
            /* eslint-disable-next-line */
            console.log('boo')
            thus.setCookie(response.data.token)
          }
        }).catch((e) => {
          this.loading = false
          this.errorConnexion = true
        })
      } catch (e) {
        this.loading = false
        /* eslint-disable-next-line */
        console.error(e)
      }
    },
    async checkAssign() {
      let find = false
      let graph = 'd7c9dd8d-8522-4086-b749-5a9930d78b37'
      if (this.$route.query.graph) {
        graph = this.$route.query.graph
      }
      if (this.user.graphs_accessible) {
        for (let i = 0; i < this.user.graphs_accessible.length; i++) {
          if (this.user.graphs_accessible[i].id === graph) {
            find = true
          }
        }
      }
      if (!find) {
        await this.$apollo.mutate({
          mutation: require('@/apollo/mutations/createGraphAssignment_deux.gql'),
          variables: {
            graph_id: graph
          }
        }).then((data) => {
          this.getNode = true
        })
      } else {
        this.getNode = true
      }
    },
    setCookie(data) {
      /* eslint-disable-next-line */
      console.log('brrrroo', data)
      this.$cookies.set('drawtoken', 'Bearer ' + data)
      /* eslint-disable-next-line */
      console.log('boo')
      this.goUser = true
      if (this.$apollo.queries.user) {
        this.$apollo.queries.user.refetch()
      }
    },
    async nextNode(elem) {
      await this.$apollo.mutate({
        mutation: require('@/apollo/mutations/finirNoeud.gql'),
        variables: {
          graph_id: this.$store.state.currentGraph,
          next_node_id: elem
        }
      }).then((data) => {
        this.$apollo.queries.node.refetch()
      })
    }
  }
}
</script>
<template lang="pug">
.home
  template(v-if="node && $cookies.get('drawtoken') && !errorConnexion")
    expression(v-if="node.data.kind === 'expressions'", :node='node', :ids='node.data.ids', @nextNode='nextNode')
    exercice(v-else-if="node.data.kind === 'exercices'", :node='node', :ids='node.data.ids')
  template(v-else-if="!$cookies.get('drawtoken') || tokenExpire || errorConnexion")
    h1 Nous avons besoins de vos identifiants pour continuer
    input(type='login', v-model='log')
    input(type='password', v-model='mdp')
    button(@click='login(log, mdp)', :disabed='loading') Connexion
    button(@click='log = null; mdp = null', :disabed='loading') Annulez
    button(@click='testCookie()') test cookie
  template(v-else)
    div.f1 Loading
</template>
<style>
</style>
