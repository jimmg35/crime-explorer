'use client'

import { translate } from '.'
import { useAppState } from '../state/AppStateContext'

export const useI18n = () => {
  const { state } = useAppState()
  return {
    lang: state.lang,
    t: (key: string) => translate(state.lang, key)
  }
}

export default useI18n
