<script>
import * as tf from '@tensorflow/tfjs'
import { fabric } from 'fabric'
export default {
  asyncData() {
    return {
      model: null,
      ctx: null,
      c: null,
      mousePressed: false,
      mouseX: 0,
      mouseY: 0,
      coords: [],
      modelLoaded: false,
      options: {
        restrictY: false,
        restrictX: false
      },
      className: null,
      imgData: null,
      prediction: null,
      indices: null,
      resultat: [],
      proba: null
    }
  },
  mounted() {
    /* eslint-disable */
    this.c = new fabric.Canvas('canvas')
    this.c.backgroundColor = '#ffffff'
    this.c.isDrawingMode = 0
    this.c.freeDrawingBrush.color = 'black'
    this.c.freeDrawingBrush.width = 10
    this.c.renderAll()
    const thus = this
    this.c.on('mouse:up', function(e) {
      thus.getFrame()
      thus.mousePressed = false
    })
    this.c.on('mouse:down', function(e) {
      // console.log('mousedown')
      thus.mousePressed = true
    })
    this.c.on('mouse:move', function(e) {
      thus.recordCoor(e)
    })
    this.startModel()
  },
  methods: {
    recordCoor(event) {
      var pointer = this.c.getPointer(event.e)
      var posX = pointer.x
      var posY = pointer.y

      if (posX >= 0 && posY >= 0 && this.mousePressed) {
          this.coords.push(pointer)
      }
    },
    async startModel() {
      this.model = await tf.loadLayersModel('tensor/model2/model.json')
      this.model.predict(tf.zeros([1, 28, 28, 1]))
      this.modelLoaded = true
      const thus = this
      await this.$axios.$get('tensor/model2/class_names.txt').then( function (response) {
        thus.className = response.split("\n")
      })
      this.c.isDrawingMode = 1
    },
    getFrame() {
      console.log(this.coords.length)
      if (this.coords.length >= 2) {
        // get image data
        this.imgData = this.getImageData()
        this.prediction = this.model.predict(this.preprocess(this.imgData)).dataSync()
        //ON va prendre les 5 predictions
        this.indices = this.findIndicesOfMax(this.prediction, 5)
        const probs = this.findTopValues(this.prediction, 5)
        const names = this.getClassNames(this.indices)
        console.log('LES NOMs', names)
        console.log('LES PROBA', probs)
        //set the table 
        this.proba = probs
        this.setTable(names, probs)
      }
    },
    getImageData() {
      // on recupere le rectangle minimum correspondant au dessin
      // en gros on trim tout ce qui est inutile dans le canvas
      const mbb = this.getMinBox()
      // on recupere les donne de l'image
      const dpi = window.devicePixelRatio
      const imgData = this.c.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
                                                      (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi)
      return imgData
    },
    getMinBox() {
      //on recupere les coordo
      var coorX = this.coords.map(function(p) {
          return p.x
      })
      var coorY = this.coords.map(function(p) {
          return p.y
      })

      //on cherche le top gauche et le bas droit
      var min_coords = {
          x: Math.min.apply(null, coorX),
          y: Math.min.apply(null, coorY)
      }
      var max_coords = {
          x: Math.max.apply(null, coorX),
          y: Math.max.apply(null, coorY)
      }

      //retourne une structure
      return {
          min: min_coords,
          max: max_coords
      }
    },
    preprocess(imgData) {
      return tf.tidy(() => {
          //converti vers tensor 0 idee de ce que ça fait
          console.log('IMAGE DATA', imgData)
          let tensor = tf.browser.fromPixels(imgData, 1)
          
          //resize 
          const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()
          
          //normalize 
          const offset = tf.scalar(255.0);
          const normalized = tf.scalar(1.0).sub(resized.div(offset));

          //Ajout d une dimension
          const batched = normalized.expandDims(0)
          return batched
      })
    },
    // on recupere les indice des top proba
    findIndicesOfMax(inp, count) {
      var outp = []
      for (var i = 0; i < inp.length; i++) {
          outp.push(i) // ajout d index dans le tableau exporter
          if (outp.length > count) {
              outp.sort(function(a, b) {
                  return inp[b] - inp[a]
              }) // trie du tableau
              outp.pop() // suppression dernier index
          }
      }
      return outp
    },
    // on trouve les 5 meilleurs predictions
    findTopValues(inp, count) {
        var outp = []
        let indices = this.findIndicesOfMax(inp, count)
        // les 5 meilleurs scores
        for (var i = 0; i < indices.length; i++)
            outp[i] = inp[indices[i]]
        return outp
    },
    // on recupere les noms de classe
    getClassNames(indices) {
      var outp = []
      for (var i = 0; i < indices.length; i++) {     
        const tempIndex = indices[i]
        outp[i] = this.className[tempIndex]
      }
      return outp
    },
    // tableau de prediction
    setTable(top5, probs) {
      //loop over the predictions 
      // console.log(this.className)
      // console.log(top5)
      // console.log(probs)
      this.resultat = []
      for (var i = 0; i < top5.length; i++) {
        console.log(top5[i])
        this.resultat.push(top5[i])
      }
    },
    clearCanva() {
      this.c.clear()
      this.c.backgroundColor = '#ffffff'
      this.coords = []
    }
  }
}
</script>
<template lang="pug">
.index
  canvas(id='canvas', width='1000', height='1000', style='border: 2px solid black')
  br
  button(@click='clearCanva()') Supprimer mon dessin
  div
    h3(v-if='!modelLoaded') Modele En cours de load
    h3(v-else) Modele loadé
    div(v-if='resultat && resultat.length') {{resultat[0]}} {{Math.round((proba[0] * 100), 2)}} %
</template>
<style>
</style>
