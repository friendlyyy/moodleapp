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
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CoreNetwork } from '@services/network';
import { CoreSites } from '@services/sites';
import { ModalController, NgZone, Translate } from '@singletons';
import { Subscription } from 'rxjs';
import { AddonModChat, AddonModChatUser } from '../../services/chat';
import { CoreSharedModule } from '@/core/shared.module';
import { CoreAlerts } from '@services/overlays/alerts';

/**
 * MMdal that displays the chat session users.
 */
@Component({
    selector: 'addon-mod-chat-users-modal',
    templateUrl: 'users-modal.html',
    imports: [
        CoreSharedModule,
    ],
})
export class AddonModChatUsersModalComponent implements OnInit, OnDestroy {

    @Input({ required: true }) sessionId!: string;
    @Input({ required: true }) cmId!: number;

    users: AddonModChatUser[] = [];
    usersLoaded = false;
    currentUserId: number;
    isOnline: boolean;

    protected onlineSubscription: Subscription;

    constructor() {
        this.isOnline = CoreNetwork.isOnline();
        this.currentUserId = CoreSites.getCurrentSiteUserId();
        this.onlineSubscription = CoreNetwork.onChange().subscribe(() => {
            // Execute the callback in the Angular zone, so change detection doesn't stop working.
            NgZone.run(() => {
                this.isOnline = CoreNetwork.isOnline();
            });
        });
    }

    /**
     * @inheritdoc
     */
    async ngOnInit(): Promise<void> {
        try {
            const data = await AddonModChat.getChatUsers(this.sessionId, { cmId: this.cmId });

            this.users = data.users;
        } catch (error) {
            CoreAlerts.showError(error, { default: Translate.instant('addon.mod_chat.errorwhilegettingchatusers') });
        } finally {
            this.usersLoaded = true;
        }
    }

    /**
     * Close the chat users modal.
     */
    closeModal(): void {
        ModalController.dismiss(<AddonModChatUsersModalResult> { users: this.users });
    }

    /**
     * Add "To user:".
     *
     * @param user User object.
     */
    talkTo(user: AddonModChatUser): void {
        ModalController.dismiss(<AddonModChatUsersModalResult> { talkTo: user.fullname, users: this.users });
    }

    /**
     * Beep a user.
     *
     * @param user User object.
     */
    beepTo(user: AddonModChatUser): void {
        ModalController.dismiss(<AddonModChatUsersModalResult> { beepTo: user.id, users: this.users });
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        this.onlineSubscription.unsubscribe();
    }

}

export type AddonModChatUsersModalResult = {
    users: AddonModChatUser[];
    talkTo?: string;
    beepTo?: number;
};
