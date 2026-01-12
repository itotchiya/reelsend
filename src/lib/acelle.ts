/**
 * Acelle Mail API Client
 * 
 * This library provides functions to interact with the Acelle Mail API
 * for managing lists, subscribers, campaigns, and analytics.
 * 
 * API Documentation: https://new.reelsend.com/frontend/docs/api/v1
 */

const ACELLE_API_URL = process.env.ACELLE_API_URL || "https://new.reelsend.com/api/v1";
const ACELLE_API_TOKEN = process.env.ACELLE_API_TOKEN || "";

// ============================================
// HELPER FUNCTIONS
// ============================================

interface AcelleResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

async function acelleRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<AcelleResponse<T>> {
    const url = new URL(`${ACELLE_API_URL}${endpoint}`);

    // Add API token to all requests
    if (!url.searchParams.has("api_token")) {
        url.searchParams.set("api_token", ACELLE_API_TOKEN);
    }

    try {
        const response = await fetch(url.toString(), {
            ...options,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[ACELLE] API Error:", data);
            return {
                success: false,
                error: data.message || data.error || `HTTP ${response.status}`,
            };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("[ACELLE] Request failed:", error);
        return {
            success: false,
            error: error.message || "Request failed",
        };
    }
}

// For form-data requests (some Acelle endpoints expect form data)
async function acelleFormRequest<T = any>(
    endpoint: string,
    formData: Record<string, string>,
    method: string = "POST"
): Promise<AcelleResponse<T>> {
    const url = new URL(`${ACELLE_API_URL}${endpoint}`);
    url.searchParams.set("api_token", ACELLE_API_TOKEN);

    // Convert form data to URLSearchParams
    const params = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
        params.append(key, value);
    });

    try {
        const response = await fetch(url.toString(), {
            method,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[ACELLE] API Error:", data);
            return {
                success: false,
                error: data.message || data.error || `HTTP ${response.status}`,
            };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("[ACELLE] Request failed:", error);
        return {
            success: false,
            error: error.message || "Request failed",
        };
    }
}

// ============================================
// AUTHENTICATION
// ============================================

export async function login(email: string, password: string): Promise<AcelleResponse<{ api_token: string }>> {
    return acelleFormRequest("/user/login", { email, password });
}

export async function generateLoginToken(): Promise<AcelleResponse<{ token: string }>> {
    return acelleRequest("/login-token", { method: "POST" });
}

// ============================================
// LISTS (Audiences)
// ============================================

export interface AcelleList {
    uid: string;
    name: string;
    from_email: string;
    from_name: string;
    default_subject?: string;
    subscribers_count?: number;
    created_at?: string;
}

export interface CreateListParams {
    name: string;
    from_email: string;
    from_name: string;
    contact: {
        company: string;
        state?: string;
        address_1?: string;
        address_2?: string;
        city?: string;
        zip?: string;
        phone?: string;
        country_id?: string;
        email: string;
        url?: string;
    };
    subscribe_confirmation?: boolean;
    send_welcome_email?: boolean;
    unsubscribe_notification?: boolean;
}

export async function createList(params: CreateListParams): Promise<AcelleResponse<AcelleList>> {
    const formData: Record<string, string> = {
        name: params.name,
        from_email: params.from_email,
        from_name: params.from_name,
        "contact[company]": params.contact.company,
        "contact[email]": params.contact.email,
    };

    // Add optional contact fields
    if (params.contact.state) formData["contact[state]"] = params.contact.state;
    if (params.contact.address_1) formData["contact[address_1]"] = params.contact.address_1;
    if (params.contact.address_2) formData["contact[address_2]"] = params.contact.address_2;
    if (params.contact.city) formData["contact[city]"] = params.contact.city;
    if (params.contact.zip) formData["contact[zip]"] = params.contact.zip;
    if (params.contact.phone) formData["contact[phone]"] = params.contact.phone;
    if (params.contact.country_id) formData["contact[country_id]"] = params.contact.country_id;
    if (params.contact.url) formData["contact[url]"] = params.contact.url;

    // Settings
    if (params.subscribe_confirmation !== undefined) {
        formData["subscribe_confirmation"] = params.subscribe_confirmation ? "1" : "0";
    }
    if (params.send_welcome_email !== undefined) {
        formData["send_welcome_email"] = params.send_welcome_email ? "1" : "0";
    }
    if (params.unsubscribe_notification !== undefined) {
        formData["unsubscribe_notification"] = params.unsubscribe_notification ? "1" : "0";
    }

    return acelleFormRequest("/lists", formData);
}

export async function getLists(): Promise<AcelleResponse<AcelleList[]>> {
    return acelleRequest("/lists", { method: "GET" });
}

export async function getList(uid: string): Promise<AcelleResponse<AcelleList>> {
    return acelleRequest(`/lists/${uid}`, { method: "GET" });
}

export async function deleteList(uid: string): Promise<AcelleResponse<{ message: string }>> {
    return acelleRequest(`/lists/${uid}`, { method: "DELETE" });
}

export async function addCustomField(
    listUid: string,
    type: "text" | "number" | "datetime",
    label: string,
    tag: string,
    defaultValue?: string
): Promise<AcelleResponse> {
    const formData: Record<string, string> = {
        type,
        label,
        tag,
    };
    if (defaultValue) formData["default_value"] = defaultValue;

    return acelleFormRequest(`/lists/${listUid}/add-field`, formData);
}

// ============================================
// SUBSCRIBERS (Contacts)
// ============================================

export interface AcelleSubscriber {
    uid: string;
    email: string;
    status: "subscribed" | "unsubscribed" | "unconfirmed";
    FIRST_NAME?: string;
    LAST_NAME?: string;
    created_at?: string;
    [key: string]: any; // Custom fields
}

export interface CreateSubscriberParams {
    list_uid: string;
    email: string;
    status?: "subscribed" | "unsubscribed" | "unconfirmed";
    tag?: string; // Comma-separated tags
    FIRST_NAME?: string;
    LAST_NAME?: string;
    PHONE?: string;
    COUNTRY?: string;
    CITY?: string;
    ADDRESS?: string;
    BIRTHDAY?: string;
    GENDER?: string;
    [key: string]: any; // Custom fields
}

export async function createSubscriber(params: CreateSubscriberParams): Promise<AcelleResponse<AcelleSubscriber>> {
    const formData: Record<string, string> = {
        list_uid: params.list_uid,
        EMAIL: params.email,
    };

    if (params.status) formData["status"] = params.status;
    if (params.tag) formData["tag"] = params.tag;
    if (params.FIRST_NAME) formData["FIRST_NAME"] = params.FIRST_NAME;
    if (params.LAST_NAME) formData["LAST_NAME"] = params.LAST_NAME;
    if (params.PHONE) formData["PHONE"] = params.PHONE;
    if (params.COUNTRY) formData["COUNTRY"] = params.COUNTRY;
    if (params.CITY) formData["CITY"] = params.CITY;
    if (params.ADDRESS) formData["ADDRESS"] = params.ADDRESS;
    if (params.BIRTHDAY) formData["BIRTHDAY"] = params.BIRTHDAY;
    if (params.GENDER) formData["GENDER"] = params.GENDER;

    return acelleFormRequest("/subscribers", formData);
}

export async function getSubscribers(
    listUid: string,
    options?: { page?: number; per_page?: number; open?: "yes" | "no"; click?: "yes" | "no" }
): Promise<AcelleResponse<AcelleSubscriber[]>> {
    const params = new URLSearchParams({ list_uid: listUid });
    if (options?.page) params.set("page", options.page.toString());
    if (options?.per_page) params.set("per_page", options.per_page.toString());
    if (options?.open) params.set("open", options.open);
    if (options?.click) params.set("click", options.click);

    return acelleRequest(`/subscribers?${params.toString()}`, { method: "GET" });
}

export async function getSubscriber(id: string): Promise<AcelleResponse<AcelleSubscriber>> {
    return acelleRequest(`/subscribers/${id}`, { method: "GET" });
}

export async function getSubscriberByEmail(email: string): Promise<AcelleResponse<AcelleSubscriber[]>> {
    return acelleRequest(`/subscribers/email/${encodeURIComponent(email)}`, { method: "GET" });
}

export async function updateSubscriber(
    id: string,
    params: Partial<CreateSubscriberParams>
): Promise<AcelleResponse<AcelleSubscriber>> {
    const formData: Record<string, string> = {};

    if (params.email) formData["EMAIL"] = params.email;
    if (params.status) formData["status"] = params.status;
    if (params.tag) formData["tag"] = params.tag;
    if (params.FIRST_NAME) formData["FIRST_NAME"] = params.FIRST_NAME;
    if (params.LAST_NAME) formData["LAST_NAME"] = params.LAST_NAME;
    if (params.PHONE) formData["PHONE"] = params.PHONE;
    if (params.COUNTRY) formData["COUNTRY"] = params.COUNTRY;
    if (params.CITY) formData["CITY"] = params.CITY;
    if (params.ADDRESS) formData["ADDRESS"] = params.ADDRESS;

    return acelleFormRequest(`/subscribers/${id}`, formData, "PATCH");
}

export async function subscribeContact(listUid: string, subscriberId: string): Promise<AcelleResponse> {
    return acelleFormRequest(`/lists/${listUid}/subscribers/${subscriberId}/subscribe`, {}, "PATCH");
}

export async function unsubscribeContact(listUid: string, subscriberId: string): Promise<AcelleResponse> {
    return acelleFormRequest(`/lists/${listUid}/subscribers/${subscriberId}/unsubscribe`, {}, "PATCH");
}

export async function unsubscribeByEmail(listUid: string, email: string): Promise<AcelleResponse> {
    return acelleFormRequest(`/lists/${listUid}/subscribers/email/${encodeURIComponent(email)}/unsubscribe`, {}, "PATCH");
}

export async function deleteSubscriber(id: string): Promise<AcelleResponse> {
    return acelleRequest(`/subscribers/${id}`, { method: "DELETE" });
}

export async function addTagToSubscriber(id: string, tags: string): Promise<AcelleResponse> {
    return acelleFormRequest(`/subscribers/${id}/add-tag`, { tag: tags });
}

export async function removeTagFromSubscriber(id: string, tags: string): Promise<AcelleResponse> {
    return acelleFormRequest(`/subscribers/${id}/remove-tag`, { tag: tags });
}

// ============================================
// CAMPAIGNS
// ============================================

export interface AcelleCampaign {
    uid: string;
    name: string;
    subject: string;
    from_email: string;
    from_name: string;
    status?: string;
    created_at?: string;
}

export interface CreateCampaignParams {
    list_uid: string;
    name: string;
    subject: string;
    from_email: string;
    from_name: string;
    reply_to?: string;
    html: string;
    track_open?: boolean;
    track_click?: boolean;
    sign_dkim?: boolean;
    skip_failed_messages?: boolean;
}

export async function createCampaign(params: CreateCampaignParams): Promise<AcelleResponse<AcelleCampaign>> {
    const formData: Record<string, string> = {
        mail_list_uid: params.list_uid,
        name: params.name,
        subject: params.subject,
        from_email: params.from_email,
        from_name: params.from_name,
        html: params.html,
    };

    if (params.reply_to) formData["reply_to"] = params.reply_to;
    if (params.track_open !== undefined) formData["track_open"] = params.track_open ? "true" : "false";
    if (params.track_click !== undefined) formData["track_click"] = params.track_click ? "true" : "false";
    if (params.sign_dkim !== undefined) formData["sign_dkim"] = params.sign_dkim ? "true" : "false";
    if (params.skip_failed_messages !== undefined) {
        formData["skip_failed_messages"] = params.skip_failed_messages ? "true" : "false";
    }

    return acelleFormRequest("/campaigns", formData);
}

export async function getCampaigns(
    options?: { page?: number; per_page?: number }
): Promise<AcelleResponse<AcelleCampaign[]>> {
    const params = new URLSearchParams();
    if (options?.page) params.set("page", options.page.toString());
    if (options?.per_page) params.set("per_page", options.per_page.toString());

    const query = params.toString() ? `?${params.toString()}` : "";
    return acelleRequest(`/campaigns${query}`, { method: "GET" });
}

export async function getCampaign(uid: string): Promise<AcelleResponse<AcelleCampaign>> {
    return acelleRequest(`/campaigns/${uid}`, { method: "GET" });
}

export async function updateCampaign(
    uid: string,
    params: Partial<CreateCampaignParams>
): Promise<AcelleResponse<AcelleCampaign>> {
    const formData: Record<string, string> = {};

    if (params.list_uid) formData["mail_list_uid"] = params.list_uid;
    if (params.name) formData["name"] = params.name;
    if (params.subject) formData["subject"] = params.subject;
    if (params.from_email) formData["from_email"] = params.from_email;
    if (params.from_name) formData["from_name"] = params.from_name;
    if (params.reply_to) formData["reply_to"] = params.reply_to;
    if (params.html) formData["html"] = params.html;

    return acelleFormRequest(`/campaigns/${uid}`, formData, "PATCH");
}

export async function runCampaign(uid: string): Promise<AcelleResponse<{ message: string }>> {
    return acelleFormRequest(`/campaigns/${uid}/run`, {});
}

export async function pauseCampaign(uid: string): Promise<AcelleResponse<{ message: string }>> {
    return acelleFormRequest(`/campaigns/${uid}/pause`, {});
}

export async function resumeCampaign(uid: string): Promise<AcelleResponse<{ message: string }>> {
    return acelleFormRequest(`/campaigns/${uid}/resume`, {});
}

export async function deleteCampaign(uid: string): Promise<AcelleResponse<{ message: string }>> {
    return acelleRequest(`/campaigns/${uid}`, { method: "DELETE" });
}

// ============================================
// ANALYTICS (Log Downloads)
// ============================================

export async function downloadTrackingLog(
    campaignUid: string,
    format: "csv" | "json" = "csv"
): Promise<AcelleResponse<string>> {
    return acelleRequest(`/campaigns/${campaignUid}/tracking-log/download?type=${format}`, { method: "GET" });
}

export async function downloadOpenLog(
    campaignUid: string,
    format: "csv" | "json" = "csv"
): Promise<AcelleResponse<string>> {
    return acelleRequest(`/campaigns/${campaignUid}/open-log/download?type=${format}`, { method: "GET" });
}

export async function downloadClickLog(
    campaignUid: string,
    format: "csv" | "json" = "csv"
): Promise<AcelleResponse<string>> {
    return acelleRequest(`/campaigns/${campaignUid}/click-log/download?type=${format}`, { method: "GET" });
}

export async function downloadBounceLog(
    campaignUid: string,
    format: "csv" | "json" = "csv"
): Promise<AcelleResponse<string>> {
    return acelleRequest(`/campaigns/${campaignUid}/bounce-log/download?type=${format}`, { method: "GET" });
}

export async function downloadFeedbackLog(
    campaignUid: string,
    format: "csv" | "json" = "csv"
): Promise<AcelleResponse<string>> {
    return acelleRequest(`/campaigns/${campaignUid}/feedback-log/download?type=${format}`, { method: "GET" });
}

export async function downloadUnsubscribeLog(
    campaignUid: string,
    format: "csv" | "json" = "csv"
): Promise<AcelleResponse<string>> {
    return acelleRequest(`/campaigns/${campaignUid}/unsubscribe-log/download?type=${format}`, { method: "GET" });
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function reportBounce(messageId: string, description?: string): Promise<AcelleResponse> {
    const formData: Record<string, string> = { message_id: messageId };
    if (description) formData["description"] = description;
    return acelleFormRequest("/notification/bounce", formData);
}

export async function reportFeedback(
    messageId: string,
    type: "spam" | "abuse",
    description?: string
): Promise<AcelleResponse> {
    const formData: Record<string, string> = { message_id: messageId, type };
    if (description) formData["description"] = description;
    return acelleFormRequest("/notification/feedback", formData);
}

// ============================================
// FILE UPLOAD
// ============================================

export async function uploadFiles(
    files: Array<{ url: string; subdirectory?: string }>
): Promise<AcelleResponse> {
    const formData: Record<string, string> = {
        files: JSON.stringify(files),
    };
    return acelleFormRequest("/file/upload", formData);
}
