// Email Builder Merge Tags Configuration
// These are the available variables that can be inserted into email templates

export interface MergeTag {
    name: string;
    value: string;
    category: string;
    description?: string;
}

// Contact-related merge tags
export const contactMergeTags: MergeTag[] = [
    {
        name: "First Name",
        value: "{{firstName}}",
        category: "Contact",
        description: "Contact's first name",
    },
    {
        name: "Last Name",
        value: "{{lastName}}",
        category: "Contact",
        description: "Contact's last name",
    },
    {
        name: "Full Name",
        value: "{{firstName}} {{lastName}}",
        category: "Contact",
        description: "Contact's full name",
    },
    {
        name: "Email",
        value: "{{email}}",
        category: "Contact",
        description: "Contact's email address",
    },
];

// Client/Company branding merge tags
export const brandingMergeTags: MergeTag[] = [
    {
        name: "Company Name",
        value: "{{client.name}}",
        category: "Branding",
        description: "Client company name",
    },
    {
        name: "Company Logo",
        value: "{{client.logo}}",
        category: "Branding",
        description: "Client company logo URL",
    },
];

// Utility merge tags
export const utilityMergeTags: MergeTag[] = [
    {
        name: "Unsubscribe Link",
        value: "{{unsubscribeUrl}}",
        category: "Utility",
        description: "Link to unsubscribe from emails",
    },
    {
        name: "View in Browser",
        value: "{{viewInBrowserUrl}}",
        category: "Utility",
        description: "Link to view email in browser",
    },
    {
        name: "Current Year",
        value: "{{currentYear}}",
        category: "Utility",
        description: "The current year (e.g., 2024)",
    },
];

// All merge tags combined
export const allMergeTags: MergeTag[] = [
    ...contactMergeTags,
    ...brandingMergeTags,
    ...utilityMergeTags,
];

// Get merge tags grouped by category
export function getMergeTagsByCategory(): Record<string, MergeTag[]> {
    return allMergeTags.reduce((acc, tag) => {
        if (!acc[tag.category]) {
            acc[tag.category] = [];
        }
        acc[tag.category].push(tag);
        return acc;
    }, {} as Record<string, MergeTag[]>);
}

// Replace merge tags with actual values
export function replaceMergeTags(
    content: string,
    data: {
        contact?: {
            firstName?: string;
            lastName?: string;
            email?: string;
        };
        client?: {
            name?: string;
            logo?: string;
        };
        unsubscribeUrl?: string;
        viewInBrowserUrl?: string;
    }
): string {
    let result = content;

    // Contact replacements
    if (data.contact) {
        result = result.replace(/\{\{firstName\}\}/g, data.contact.firstName || "");
        result = result.replace(/\{\{lastName\}\}/g, data.contact.lastName || "");
        result = result.replace(/\{\{email\}\}/g, data.contact.email || "");
    }

    // Client/branding replacements
    if (data.client) {
        result = result.replace(/\{\{client\.name\}\}/g, data.client.name || "");
        result = result.replace(/\{\{client\.logo\}\}/g, data.client.logo || "");
    }

    // Utility replacements
    result = result.replace(/\{\{unsubscribeUrl\}\}/g, data.unsubscribeUrl || "#");
    result = result.replace(/\{\{viewInBrowserUrl\}\}/g, data.viewInBrowserUrl || "#");
    result = result.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());

    return result;
}
