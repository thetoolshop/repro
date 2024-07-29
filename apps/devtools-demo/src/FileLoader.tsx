import { Card } from '@repro/design'
import React from 'react'

interface Props {
  onLoad(file: File): void
}

export const FileLoader: React.FC<Props> = ({ onLoad }) => {
  function handleChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.currentTarget.files?.item(0)

    if (file) {
      onLoad(file)
    }
  }

  return (
    <Card height="100%">
      <input type="file" accept=".repro" onChange={handleChange} />
    </Card>
  )
}
