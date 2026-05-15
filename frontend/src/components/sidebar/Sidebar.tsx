import SidebarButton from "@/components/sidebar/sidebar-views/SidebarButton"
import { useAppContext } from "@/context/AppContext"
import { useSocket } from "@/context/SocketContext"
import { useViews } from "@/context/ViewContext"
import useResponsive from "@/hooks/useResponsive"
import useWindowDimensions from "@/hooks/useWindowDimensions"
import { ACTIVITY_STATE } from "@/types/app"
import { SocketEvent } from "@/types/socket"
import { VIEWS } from "@/types/view"
import cn from "classnames"
import {
    useCallStateHooks,
    ParticipantsAudio,
} from "@stream-io/video-react-sdk"
import { useState, useEffect } from "react"
import { PiMicrophone } from "react-icons/pi"
import { BiMicrophoneOff } from "react-icons/bi"
import { tooltipStyles } from "./tooltipStyles"
import { Tooltip } from "react-tooltip"
import { IoCodeSlash } from "react-icons/io5"
import { MdOutlineDraw } from "react-icons/md"

/**
 * Sidebar Component
 * Handles Navigation, Drawing/Coding State, and Voice Call Controls
 */
function Sidebar() {
    // 1. SDK Hooks - Always use these for the source of truth
    const { useMicrophoneState, useParticipants } = useCallStateHooks()
    const { microphone, isMute } = useMicrophoneState()
    const participants = useParticipants()

    // 2. App/View Contexts
    const {
        activeView,
        isSidebarOpen,
        viewComponents,
        viewIcons,
        setIsSidebarOpen,
    } = useViews()
    const { minHeightReached } = useResponsive()
    const { activityState, setActivityState } = useAppContext()
    const { socket } = useSocket()
    const { isMobile } = useWindowDimensions()

    // 3. UI State
    const [showTooltip, setShowTooltip] = useState(true)

    // Log participants to verify they are in the call
    useEffect(() => {
        console.log("Current Participants:", participants)
    }, [participants])

    /**
     * Toggles Microphone using Stream SDK
     * We don't use local state for the icon anymore; we use 'isMute' from the SDK
     */
    const toggleMicrophone = async () => {
        try {
            if (isMute) {
                await microphone.enable()
            } else {
                await microphone.disable()
            }
        } catch (error) {
            console.error("Error toggling microphone:", error)
        }
    }

    /**
     * Switches between Coding and Drawing modes
     */
    const changeState = () => {
        setShowTooltip(false)
        if (activityState === ACTIVITY_STATE.CODING) {
            setActivityState(ACTIVITY_STATE.DRAWING)
            socket.emit(SocketEvent.REQUEST_DRAWING)
        } else {
            setActivityState(ACTIVITY_STATE.CODING)
        }

        if (isMobile) {
            setIsSidebarOpen(false)
        }
    }

    return (
        <aside className="flex w-full md:h-full md:max-h-full md:min-h-full md:w-auto">
            {/* CRITICAL: ParticipantsAudio must be rendered for you to hear others.
                It is a "headless" component that injects <audio> tags into the DOM.
            */}
            <ParticipantsAudio participants={participants} />

            <div
                className={cn(
                    "fixed bottom-0 left-0 z-50 flex h-[50px] w-full self-end overflow-hidden border-t bg-[#252526] text-white md:static md:h-full md:w-[50px] md:min-w-[50px] md:flex-col md:justify-between md:border-r md:border-t-0",
                    {
                        hidden: minHeightReached,
                    },
                )}
            >
                <div className="flex flex-row md:flex-col items-center w-full">
                    {/* Navigation Buttons */}
                    <SidebarButton
                        viewName={VIEWS.FILES}
                        icon={viewIcons[VIEWS.FILES]}
                    />
                    <SidebarButton
                        viewName={VIEWS.CHATS}
                        icon={viewIcons[VIEWS.CHATS]}
                    />
                    <SidebarButton
                        viewName={VIEWS.COPILOT}
                        icon={viewIcons[VIEWS.COPILOT]}
                    />
                    <SidebarButton
                        viewName={VIEWS.RUN}
                        icon={viewIcons[VIEWS.RUN]}
                    />
                    <SidebarButton
                        viewName={VIEWS.CLIENTS}
                        icon={viewIcons[VIEWS.CLIENTS]}
                    />

                    {/* Mode Switcher (Coding/Drawing) */}
                    <div className="relative flex flex-col items-center">
                        <button
                            className="justify-center flex items-center rounded p-2 transition-colors duration-200 ease-in-out hover:bg-[#3D404A]"
                            onClick={changeState}
                            onMouseEnter={() => setShowTooltip(true)}
                            data-tooltip-id="activity-state-tooltip"
                            data-tooltip-content={
                                activityState === ACTIVITY_STATE.CODING
                                    ? "Switch to Drawing Mode"
                                    : "Switch to Coding Mode"
                            }
                        >
                            {activityState === ACTIVITY_STATE.CODING ? (
                                <MdOutlineDraw size={30} />
                            ) : (
                                <IoCodeSlash size={30} />
                            )}
                        </button>
                        {showTooltip && (
                            <Tooltip
                                id="activity-state-tooltip"
                                place="right"
                                offset={15}
                                className="!z-50"
                                style={tooltipStyles}
                                noArrow={false}
                                positionStrategy="fixed"
                                float={true}
                            />
                        )}
                    </div>

                    {/* Voice Call Microphone Toggle */}
                    <div className="w-full justify-center p-2 items-center flex flex-col">
                        <button
                            className={cn(
                                "mic-button pt-2 transition-all duration-200 active:scale-90",
                                isMute ? "text-red-500" : "text-green-500"
                            )}
                            onClick={toggleMicrophone}
                            title={isMute ? "Unmute Microphone" : "Mute Microphone"}
                        >
                            {isMute ? (
                                <BiMicrophoneOff size={30} />
                            ) : (
                                <PiMicrophone size={30} />
                            )}
                        </button>
                    </div>

                    {/* Settings Button */}
                    <SidebarButton
                        viewName={VIEWS.SETTINGS}
                        icon={viewIcons[VIEWS.SETTINGS]}
                    />
                </div>
            </div>

            {/* Sidebar Expanded View */}
            <div
                className="absolute left-0 top-0 z-20 w-full flex-col bg-[#252526] text-white md:static md:min-w-[300px]"
                style={isSidebarOpen ? {} : { display: "none" }}
            >
                {viewComponents[activeView]}
            </div>
        </aside>
    )
}

export default Sidebar