// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Component, OnInit } from '@angular/core';
import { CoreUser } from '@features/user/services/user';
import { CoreNavigator } from '@services/navigator';
import { CoreSites } from '@services/sites';
import { CorePromiseUtils } from '@singletons/promise-utils';
import { AddonModChat } from '../../services/chat';
import { AddonModChatFormattedSessionMessage, AddonModChatHelper } from '../../services/chat-helper';
import { CoreAnalytics, CoreAnalyticsEventType } from '@services/analytics';
import { Translate } from '@singletons';
import { CoreTime } from '@singletons/time';
import { CoreAlerts } from '@services/overlays/alerts';
import { CoreSharedModule } from '@/core/shared.module';

/**
 * Page that displays list of chat session messages.
 */
@Component({
    selector: 'page-addon-mod-chat-session-messages',
    templateUrl: 'session-messages.html',
    styleUrls: ['../../../../../theme/components/discussion.scss', 'session-messages.scss'],
    imports: [
        CoreSharedModule,
    ],
})
export default class AddonModChatSessionMessagesPage implements OnInit {

    currentUserId!: number;
    cmId!: number;
    messages: AddonModChatFormattedSessionMessage[] = [];
    loaded = false;
    courseId!: number;

    protected chatId!: number;
    protected sessionStart!: number;
    protected sessionEnd!: number;
    protected groupId!: number;
    protected logView: () => void;

    constructor() {
        this.logView = CoreTime.once(async () => {
            await CorePromiseUtils.ignoreErrors(AddonModChat.logViewSessions(this.cmId, {
                start: this.sessionStart,
                end: this.sessionEnd,
            }));

            CoreAnalytics.logEvent({
                type: CoreAnalyticsEventType.VIEW_ITEM,
                ws: 'mod_chat_view_sessions',
                name: Translate.instant('addon.mod_chat.messages'),
                data: { chatid: this.chatId, category: 'chat', start: this.sessionStart, end: this.sessionEnd },
                url: `/mod/chat/report.php?id=${this.cmId}&start=${this.sessionStart}&end=${this.sessionEnd}`,
            });
        });
    }

    /**
     * @inheritdoc
     */
    ngOnInit(): void {
        try {
            this.courseId = CoreNavigator.getRequiredRouteNumberParam('courseId');
            this.cmId = CoreNavigator.getRequiredRouteNumberParam('cmId');
            this.sessionStart = CoreNavigator.getRequiredRouteNumberParam('sessionStart');
            this.sessionEnd = CoreNavigator.getRequiredRouteNumberParam('sessionEnd');
            this.chatId = CoreNavigator.getRequiredRouteNumberParam('chatId');
            this.groupId = CoreNavigator.getRouteNumberParam('groupId') || 0;
        } catch (error) {
            CoreAlerts.showError(error);
            CoreNavigator.back();

            return;
        }

        this.currentUserId = CoreSites.getCurrentSiteUserId();

        this.fetchMessages();
    }

    /**
     * Fetch session messages.
     *
     * @returns Promise resolved when done.
     */
    protected async fetchMessages(): Promise<void> {
        try {
            const messages = await AddonModChat.getSessionMessages(
                this.chatId,
                this.sessionStart,
                this.sessionEnd,
                this.groupId,
                { cmId: this.cmId },
            );

            this.messages = await AddonModChat.getMessagesUserData(messages, this.courseId);

            // Calculate which messages need to display the date or user data.
            for (let index = 0 ; index < this.messages.length; index++) {
                const prevMessage = index > 0 ? this.messages[index - 1] : undefined;

                this.messages[index] = AddonModChatHelper.formatMessage(this.currentUserId, this.messages[index], prevMessage);

                const message = this.messages[index];

                if (message.beep && message.beep !== this.currentUserId) {
                    this.loadMessageBeepWho(message);
                }
            }

            this.messages[this.messages.length - 1].showTail = true;
        } catch (error) {
            CoreAlerts.showError(error, { default: Translate.instant('core.errorloadingcontent') });
        } finally {
            this.loaded = true;
        }
    }

    protected async loadMessageBeepWho(message: AddonModChatFormattedSessionMessage): Promise<void> {
        message.beepWho = await this.getUserFullname(message.beep!);
    }

    /**
     * Get the user fullname for a beep.
     *
     * @param id User Id before parsing.
     * @returns User fullname.
     */
    protected async getUserFullname(id: string | number): Promise<string> {
        const idNumber = Number(id);

        if (isNaN(idNumber)) {
            return String(id);
        }

        try {
            const user = await CoreUser.getProfile(idNumber, this.courseId, true);

            return user.fullname;
        } catch {
            // Error getting profile.
            return String(id);
        }
    }

    /**
     * Refresh session messages.
     *
     * @param refresher Refresher.
     */
    async refreshMessages(refresher: HTMLIonRefresherElement): Promise<void> {
        try {
            await CorePromiseUtils.ignoreErrors(
                AddonModChat.invalidateSessionMessages(this.chatId, this.sessionStart, this.groupId),
            );

            await this.fetchMessages();
        } finally {
            refresher.complete();
        }
    }

}
