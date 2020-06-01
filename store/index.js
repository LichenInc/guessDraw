export const state = () => ({
  login: null,
  password: null,
  currentGraph: null,
  node: null,
  currentNode: null,
  mobileTemplate: false,
  soundPlayed: false,
  historique: [],
  etape: null
})

export const mutations = {
  setMobileTemplate(state, payload) {
    state.mobileTemplate = payload
  },
  setCurrendNode(state, node) {
    state.currentNode = node
  },
  setNode(state, node) {
    state.node = node
  },
  setCurrentGraph(state, graph) {
    state.currentGraph = graph
  },
  setLogin(state, login) {
    state.login = login
  },
  setPassword(state, password) {
    state.password = password
  }
}
