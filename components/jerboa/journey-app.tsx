'use client'

import { SessionProvider, useSession } from '@/lib/jerboa/session-context'
import { PanelStage } from './scene'
import { WelcomeScreen } from './welcome-screen'
import { SignInScreen } from './signin-screen'
import { LogInScreen } from './login-screen'
import { DetailsScreen } from './details-screen'
import { InformationScreen } from './information-screen'
import { ConsentScreen } from './consent-screen'
import { DeclinedScreen } from './declined-screen'
import { TitleScreen } from './title-screen'
import { MapScreen } from './map-screen'

function CurrentScreen() {
  const { step, participant } = useSession()

  switch (step) {
    case 'welcome':
      return (
        <PanelStage>
          <WelcomeScreen />
        </PanelStage>
      )
    case 'signin':
      return (
        <PanelStage>
          <SignInScreen />
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
          <DetailsScreen key={participant?.id ?? 'new'} />
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
