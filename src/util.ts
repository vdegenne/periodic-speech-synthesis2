import { isFullJapanese } from 'asian-regexps'
import { getExactSearch } from 'japanese-data-module'
import { speakJapanese } from './speech'

/**
 * AUDIO
 **********/
const audioMap: { [word: string]: Blob | Promise<Response> } = {}

export async function playJapanese(word, volume = 1) {
  let audio: HTMLAudioElement
  if (word in audioMap) {
    if (audioMap[word] instanceof Promise) {
      // wait for the blob
      const response = await audioMap[word]
      await new Promise((resolve, reject) => { setTimeout(resolve, 100) })
    }

    audio = createAudioElementFromBlob(audioMap[word] as Blob)
  }
  else {
    const responsePromise = fetch(`https://assiets.vdegenne.com/data/japanese/audio/${encodeURIComponent(word)}`)
    audioMap[word] = responsePromise
    const response = await responsePromise
    const blob = audioMap[word] = await response.blob()
    audio = createAudioElementFromBlob(blob)
  }

  return new Promise((resolve, reject) => {
    audio.volume = volume
    audio.onerror = () => reject()
    audio.onended = () => {
      resolve(audio)
    }
    audio.play()
  })
}

export function createAudioElementFromBlob(blob: Blob) {
  return new Audio(URL.createObjectURL(blob))
}


export async function playJapaneseAudio(word: string, withSearch = true) {
  try {
    if (withSearch == false) {
      await playJapanese(word)
      return
    }
    // with search
    let hiragana
    const search = getExactSearch(word)
    if (search && search[4]) {
      hiragana = search[4]
    }
    if (hiragana && hiragana.length < 8) {
      await playJapanese(hiragana)
    }
    else if (word.length < 8) {
      await playJapanese(word)
    }
    else {
      throw new Error;
    }
  } catch (e) {
    await speakJapanese(word, 1, 0.8)
  }
}

export async function sleep (ms = 1000) {
  await new Promise(r=>setTimeout(r,ms))
}



export function googleImageSearch (word: string) {
  window.open(`http://www.google.com/search?q=${encodeURIComponent(word)}&tbm=isch`, '_blank')
}
export function jisho(word: string) {
  // window.open(`https://jisho.org/search/${encodeURIComponent(word)}%20%23kanji`, '_blank')
  window.open(`https://jisho.org/search/${encodeURIComponent(word)}`, '_blank')
}





export async function playWord(word: string) {
  if (!word) return

  // Update the title
  document.title = word

  const parenthesisMatch = word.match(/\((.+)\)/)
  if (parenthesisMatch) {
    word = parenthesisMatch[1]
  }

  // Japanese
  if (isFullJapanese(word)) {
    if (parenthesisMatch) {
      await playJapaneseAudio(word, false)
    }
    else {
      await playJapaneseAudio(word, true)
    }
  }
  else {
    // @TODO another language
  }
}


export const urlRegexp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
