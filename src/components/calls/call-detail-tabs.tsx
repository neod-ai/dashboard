'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TranscriptStream } from '@/components/transcript-stream'
import { CallLogViewer } from '@/components/calls/call-log-viewer'
import type { TurnMetrics } from '@/lib/types'

interface CallDetailTabsProps {
  callSid: string
  turns: TurnMetrics[]
  isActive: boolean
  greeting?: string
}

export function CallDetailTabs({ callSid, turns, isActive, greeting }: CallDetailTabsProps) {
  return (
    <Tabs defaultValue="transcript" className="flex flex-1 flex-col min-h-0">
      <TabsList variant="line" className="shrink-0 px-6 h-10">
        <TabsTrigger value="transcript">Transcript</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>
      <TabsContent value="transcript" className="flex-1 overflow-y-auto">
        <TranscriptStream turns={turns} autoScroll={isActive} greeting={greeting} />
      </TabsContent>
      <TabsContent value="logs" className="flex-1 overflow-hidden">
        <CallLogViewer callSid={callSid} isActive={isActive} />
      </TabsContent>
    </Tabs>
  )
}
