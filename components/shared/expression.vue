<script>
export default {
  props: {
    ids: { type: Array, required: true },
    node: { type: Object, required: true }
  },
  apollo: {
    expression: {
      query: require('@/apollo/queries/expression.gql'),
      variables() {
        return {
          id: this.ids[0]
        }
      },
      update(data) {
        let timing = 3000
        if (this.node.variables.length > 0) {
          this.node.variables.forEach((elem) => {
            if (elem.key === 'timing') {
              timing = elem.value * 1000
            }
          })
        }
        if (this.node.outgoing_edges.length === 1) {
          const thus = this
          setTimeout(function () {
            thus.nextNode(thus.node.outgoing_edges[0].target_id)
          }, timing)
        }
        return data.expression
      }
    }
  },
  methods: {
    nextNode(node) {
      this.$emit('nextNode', node)
    }
  }
}
</script>
<template lang="pug">
.expression(v-if='expression')
  h1 {{expression.titre}}
</template>
<style>
</style>
