import styled from '@emotion/styled'

import { Label } from '../../app/components/Label'

export const MutedLabel = styled(Label)(({ theme }) => ({
  color: theme.colors.secondary,
  fontWeight: 400,
}))
