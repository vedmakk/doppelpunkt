import React from 'react'
import styled from '@emotion/styled'

import { Label } from '../../app/components/Label'

interface SectionTitleProps {
  children: React.ReactNode
  className?: string
}

const SectionLabel = styled(Label)(({ theme }) => ({
  color: theme.colors.secondary,
  fontWeight: 600,
  margin: 0,
}))

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  className,
}) => (
  <SectionLabel as="h2" size="small" className={className}>
    {children}
  </SectionLabel>
)
