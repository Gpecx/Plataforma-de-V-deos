export interface ChatMessage {
    id: number;
    name: string;
    text: string;
    time: string;
    isTeacher: boolean;
}

export interface Participant {
    id: number;
    name: string;
    online: boolean;
}
