import { Circle } from '@shopify/react-native-skia'

// Reconciled from BoxHockey's and AirHockey's Board.tsx — both render a goal's marker post as
// this exact Circle, confirmed character-for-character identical in both files. Which player owns
// a given post (and thus which color to pass in) is real game logic and stays with the caller —
// this component only ever receives the already-resolved color.

export type GoalPostProps = {
  x: number
  y: number
  radius: number
  color: string
}

export function GoalPost({ x, y, radius, color }: GoalPostProps) {
  return <Circle cx={x} cy={y} r={radius} color={color} />
}
