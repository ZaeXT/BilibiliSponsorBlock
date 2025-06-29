import {
    SponsorTime,
    SegmentUUID,
    VideoInfo,
    PortVideo,
    Category,
    ToggleSkippable,
} from "../../types";
import SkipNotice from "../../render/SkipNotice";
import advanceSkipNotice from "../../render/advanceSkipNotice";
import SubmissionNotice from "../../render/SubmissionNotice";

/**
 * 中央状态管理器
 * 负责管理所有全局状态，提供统一的状态访问和更新接口
 * 保持与原有代码的兼容性，逐步迁移状态管理
 */
export class StateManager {
    // === 赞助片段相关状态 ===
    private _sponsorDataFound = false;
    private _sponsorTimes: SponsorTime[] = [];
    private _sponsorTimesSubmitting: SponsorTime[] = [];
    private _sponsorSkipped: boolean[] = [];
    private _selectedSegment: SegmentUUID | null = null;
    private _previewedSegment = false;

    // === 视频相关状态 ===
    private _videoInfo: VideoInfo = null;
    private _portVideo: PortVideo = null;
    private _channelWhitelisted = false;
    private _lockedCategories: Category[] = [];
    private _switchingVideos: boolean | null = null;

    // === UI组件状态 ===
    private _skipNotices: SkipNotice[] = [];
    private _advanceSkipNotices: advanceSkipNotice | null = null;
    private _activeSkipKeybindElement: ToggleSkippable = null;
    private _submissionNotice: SubmissionNotice = null;

    // === 时间和调度相关状态 ===
    private _lastKnownVideoTime: {
        videoTime: number;
        preciseTime: number;
        fromPause: boolean;
        approximateDelay: number;
    } = {
            videoTime: null,
            preciseTime: null,
            fromPause: false,
            approximateDelay: null,
        };
    private _lastTimeFromWaitingEvent: number = null;
    private _currentSkipSchedule: NodeJS.Timeout = null;
    private _currentSkipInterval: NodeJS.Timeout = null;
    private _currentVirtualTimeInterval: NodeJS.Timeout = null;
    private _currentadvanceSkipSchedule: NodeJS.Timeout = null;

    // === 播放状态 ===
    private _lastCheckTime = 0;
    private _lastCheckVideoTime = -1;
    private _videoMuted = false;

    // === 其他状态 ===
    private _shownSegmentFailedToFetchWarning = false;
    private _lastResponseStatus = 0;
    private _lookupWaiting = false;
    private _headerLoaded = false;
    private _lastPreviewBarUpdate: string = null;

    // === 状态访问器 (Getters) ===
    get sponsorDataFound(): boolean { return this._sponsorDataFound; }
    get sponsorTimes(): SponsorTime[] { return this._sponsorTimes; }
    get sponsorTimesSubmitting(): SponsorTime[] { return this._sponsorTimesSubmitting; }
    get sponsorSkipped(): boolean[] { return this._sponsorSkipped; }
    get selectedSegment(): SegmentUUID | null { return this._selectedSegment; }
    get previewedSegment(): boolean { return this._previewedSegment; }

    get videoInfo(): VideoInfo { return this._videoInfo; }
    get portVideo(): PortVideo { return this._portVideo; }
    get channelWhitelisted(): boolean { return this._channelWhitelisted; }
    get lockedCategories(): Category[] { return this._lockedCategories; }
    get switchingVideos(): boolean | null { return this._switchingVideos; }

    get skipNotices(): SkipNotice[] { return this._skipNotices; }
    get advanceSkipNotices(): advanceSkipNotice | null { return this._advanceSkipNotices; }
    get activeSkipKeybindElement(): ToggleSkippable { return this._activeSkipKeybindElement; }
    get submissionNotice(): SubmissionNotice { return this._submissionNotice; }

    get lastKnownVideoTime() { return this._lastKnownVideoTime; }
    get lastTimeFromWaitingEvent(): number { return this._lastTimeFromWaitingEvent; }
    get currentSkipSchedule(): NodeJS.Timeout { return this._currentSkipSchedule; }
    get currentSkipInterval(): NodeJS.Timeout { return this._currentSkipInterval; }
    get currentVirtualTimeInterval(): NodeJS.Timeout { return this._currentVirtualTimeInterval; }
    get currentadvanceSkipSchedule(): NodeJS.Timeout { return this._currentadvanceSkipSchedule; }

    get lastCheckTime(): number { return this._lastCheckTime; }
    get lastCheckVideoTime(): number { return this._lastCheckVideoTime; }
    get videoMuted(): boolean { return this._videoMuted; }

    get shownSegmentFailedToFetchWarning(): boolean { return this._shownSegmentFailedToFetchWarning; }
    get lastResponseStatus(): number { return this._lastResponseStatus; }
    get lookupWaiting(): boolean { return this._lookupWaiting; }
    get headerLoaded(): boolean { return this._headerLoaded; }
    get lastPreviewBarUpdate(): string { return this._lastPreviewBarUpdate; }

    // === 状态修改器 (Setters) ===
    setSponsorDataFound(value: boolean): void { this._sponsorDataFound = value; }
    setSponsorTimes(value: SponsorTime[]): void { this._sponsorTimes = value; }
    setSponsorTimesSubmitting(value: SponsorTime[]): void { this._sponsorTimesSubmitting = value; }
    setSponsorSkipped(value: boolean[]): void { this._sponsorSkipped = value; }
    setSelectedSegment(value: SegmentUUID | null): void { this._selectedSegment = value; }
    setPreviewedSegment(value: boolean): void { this._previewedSegment = value; }

    setVideoInfo(value: VideoInfo): void { this._videoInfo = value; }
    setPortVideo(value: PortVideo): void { this._portVideo = value; }
    setChannelWhitelisted(value: boolean): void { this._channelWhitelisted = value; }
    setLockedCategories(value: Category[]): void { this._lockedCategories = value; }
    setSwitchingVideos(value: boolean | null): void { this._switchingVideos = value; }

    setSkipNotices(value: SkipNotice[]): void { this._skipNotices = value; }
    setAdvanceSkipNotices(value: advanceSkipNotice | null): void { this._advanceSkipNotices = value; }
    setActiveSkipKeybindElement(value: ToggleSkippable): void { this._activeSkipKeybindElement = value; }
    setSubmissionNotice(value: SubmissionNotice): void { this._submissionNotice = value; }

    setLastTimeFromWaitingEvent(value: number): void { this._lastTimeFromWaitingEvent = value; }
    setCurrentSkipSchedule(value: NodeJS.Timeout): void { this._currentSkipSchedule = value; }
    setCurrentSkipInterval(value: NodeJS.Timeout): void { this._currentSkipInterval = value; }
    setCurrentVirtualTimeInterval(value: NodeJS.Timeout): void { this._currentVirtualTimeInterval = value; }
    setCurrentadvanceSkipSchedule(value: NodeJS.Timeout): void { this._currentadvanceSkipSchedule = value; }

    setLastCheckTime(value: number): void { this._lastCheckTime = value; }
    setLastCheckVideoTime(value: number): void { this._lastCheckVideoTime = value; }
    setVideoMuted(value: boolean): void { this._videoMuted = value; }

    setShownSegmentFailedToFetchWarning(value: boolean): void { this._shownSegmentFailedToFetchWarning = value; }
    setLastResponseStatus(value: number): void { this._lastResponseStatus = value; }
    setLookupWaiting(value: boolean): void { this._lookupWaiting = value; }
    setHeaderLoaded(value: boolean): void { this._headerLoaded = value; }
    setLastPreviewBarUpdate(value: string): void { this._lastPreviewBarUpdate = value; }

    // === 复合操作方法 ===

    /**
     * 重置所有与视频相关的状态
     * 保持与原 resetValues 函数相同的逻辑
     */
    resetVideoRelatedState(): void {
        this._lastCheckTime = 0;
        this._lastCheckVideoTime = -1;
        this._previewedSegment = false;

        this._sponsorTimes = [];
        this._sponsorSkipped = [];
        this._lastResponseStatus = 0;
        this._shownSegmentFailedToFetchWarning = false;

        this._videoInfo = null;
        this._channelWhitelisted = false;
        this._lockedCategories = [];

        this._sponsorDataFound = false;

        if (this._switchingVideos === null) {
            this._switchingVideos = false;
        } else {
            this._switchingVideos = true;
        }
    }

    /**
     * 清理所有定时器
     */
    clearAllTimers(): void {
        if (this._currentSkipSchedule !== null) {
            clearTimeout(this._currentSkipSchedule);
            this._currentSkipSchedule = null;
        }
        if (this._currentSkipInterval !== null) {
            clearInterval(this._currentSkipInterval);
            this._currentSkipInterval = null;
        }
        if (this._currentVirtualTimeInterval !== null) {
            clearInterval(this._currentVirtualTimeInterval);
            this._currentVirtualTimeInterval = null;
        }
        if (this._currentadvanceSkipSchedule !== null) {
            clearInterval(this._currentadvanceSkipSchedule);
            this._currentadvanceSkipSchedule = null;
        }
    }

    /**
     * 更新虚拟时间相关状态
     */
    updateVirtualTimeState(videoTime: number, preciseTime: number, fromPause: boolean = false): void {
        this._lastKnownVideoTime.videoTime = videoTime;
        this._lastKnownVideoTime.preciseTime = preciseTime;
        this._lastKnownVideoTime.fromPause = fromPause;
    }

    /**
     * 添加跳过通知到列表
     */
    addSkipNotice(notice: SkipNotice): void {
        this._skipNotices.push(notice);
    }

    /**
     * 移除跳过通知
     */
    removeSkipNotice(notice: SkipNotice): void {
        const index = this._skipNotices.indexOf(notice);
        if (index > -1) {
            this._skipNotices.splice(index, 1);
        }
    }

    /**
     * 清空所有跳过通知
     */
    clearAllSkipNotices(): void {
        for (const notice of this._skipNotices) {
            notice?.close();
        }
        this._skipNotices.length = 0;
    }
}

// 创建全局状态管理器实例
export const stateManager = new StateManager();
