<script>
import draw from '@/components/shared/draw'
export default {
  components: {
    draw
  },
  props: {
    ids: { type: Array, required: true }
  },
  data() {
    return {
      currentQuestion: null,
      good: false,
      bad: false,
      index: 0
    }
  },
  apollo: {
    questions: {
      query: require('@/apollo/queries/questions.gql'),
      variables() {
        return {
          ids: this.ids
        }
      },
      update(data) {
        if (data.questions && data.questions.length > 0) {
          this.currentQuestion = data.questions[0]
        }
        return data.questions
      }
    }
  },
  methods: {
    async sendResponse(val) {
      const thus = this
      await this.$apollo.mutate({
        mutation: require('@/apollo/mutations/questions_envoyer_reponse'),
        variables: {
          graph_id: this.$store.state.currentGraph,
          reponse: val,
          question_id: this.currentQuestion.id,
          temps: 0
        }
      }).then(({ data }) => {
        /* eslint-disable */
        console.log(data)
        if (data.questions_envoyer_reponse === 1) {
          // this.$nextTick(() => {
          console.log('YOUU')
          thus.good = true
          thus.bad = false
          thus.nextQuestion()
          // })
        } else {
          // this.$nextTick(() => {
          thus.bad = true
          thus.good = false
          // })
        }
      })
    },
    nextQuestion() {
      if (this.questions.length > 1 && this.index < this.questions.length - 1) {
        // on a d autres questions
        this.index ++
        this.currentQuestion = this.questions[this.index]
      }
    }
  }
}
</script>
<template lang="pug">
.exercice(v-if='questions')
  h1(v-html='currentQuestion.titre')
  draw(:titre='currentQuestion.titre', :modele='currentQuestion.tensor_flow_modele', @testValue='sendResponse', :good='good', :bad='bad')
</template>
<style>
</style>
