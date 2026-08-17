'use client'

import { SessionProvider, useSession } from '@/lib/jerboa/session-context'
import { PanelStage } from './scene'
import { IntroScreen } from './intro-screen'
import { WelcomeScreen } from './welcome-screen'
import { SignInScreen } from './signin-screen'
import { LogInScreen } from './login-screen'
import { DetailsScreen } from './details-screen'
import { InformationScreen } from './information-screen'
import { ConsentScreen } from './consent-screen'
import { DeclinedScreen } from './declined-screen'
import { TitleScreen } from './title-screen'
import { MapScreen } from './map-screen'
import { MinigameOneScreen } from './minigame-one-screen'
import { Jerboa3dScreen } from './jerboa-3d-screen'

function CurrentScreen() {
  const { step, participant, credentials } = useSession()

  switch (step) {
    case 'intro':
      return <IntroScreen />
    case 'welcome':
      return (
        <PanelStage>
          <WelcomeScreen />
        </PanelStage>
      )
    case 'signin':
      return (
        <PanelStage>
          <SignInScreen key={credentials?.userid ?? 'new'} />
        </PanelStage>
      )
    case 'login':
      return (
        <PanelStage>
          <LogInScreen />
        </PanelStage>
      )
    case 'userdatasetup':
      return (
        <PanelStage>
          <DetailsScreen mode="signup" key={credentials?.userid ?? 'signup'} />
        </PanelStage>
      )
    case 'settings':
      return (
        <PanelStage>
          <DetailsScreen mode="settings" key={participant?.id ?? 'settings'} />
        </PanelStage>
      )
    case 'information':
      return (
        <PanelStage>
          <InformationScreen />
        </PanelStage>
      )
    case 'consent':
      return (
        <PanelStage>
          <ConsentScreen />
        </PanelStage>
      )
    case 'declined':
      return (
        <PanelStage>
          <DeclinedScreen />
        </PanelStage>
      )
    case 'title':
      return <TitleScreen />
    case 'map':
      return <MapScreen />
    case 'minigame1':
      return <MinigameOneScreen />
    case 'jerboa3d':
      return <Jerboa3dScreen />
    default:
      return null
  }
}

export function JourneyApp() {
  return (
    <SessionProvider>
      <CurrentScreen />
    </SessionProvider>
  )
}
