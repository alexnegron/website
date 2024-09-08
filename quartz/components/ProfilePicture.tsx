import { QuartzComponentConstructor } from "./types"

function ProfilePicture() {
  return (
    <div className="profile-picture">
      <img src="/static/profile.jpg" alt="Alex Negron" />
    </div> 
  )
}


export default (() => ProfilePicture) satisfies QuartzComponentConstructor