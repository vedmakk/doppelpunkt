import { useAppSelector } from '../store'
import { selectWritingMode } from './selectors'

export const useWritingMode = () => useAppSelector(selectWritingMode)
