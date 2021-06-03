import { FC } from "react"
import Track from "../../interfaces/Track"
import Style from '../Grid'
import TrackPanel from "./TrackPanel"

const TrackGrid: FC<{ tracks: Track[] }> = ({ tracks }) => (
   <Style>
      {tracks.map((track, i) =>
         <TrackPanel key={track.id ?? i} {...track} />
      )}
   </Style>
)

export default TrackGrid