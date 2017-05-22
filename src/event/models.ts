import { Document, model, Model, Schema, Types } from 'mongoose';


const ALPHABET = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
const ALPHABET_LENGTH = ALPHABET.length;
const divmod = (dividend, divisor) => {
    let quotient = Math.floor(dividend / divisor);
    let remainder = dividend % divisor;
    return [quotient, remainder];
};


const EventSchema = new Schema({
    english_name: { type: String, required: true, unique: true },
    chinese_name: { type: String },
    translation_url: { type: String },
    start_at: { type: Date, required: true },
    end_at: { type: Date, required: true },
    hashcode: { type: String, unique: true },
});
EventSchema.index({ english_name: 'text' });
export interface EventProperties {
    english_name: string;
    chinese_name?: string;
    translation_url?: string;
    start_at: Date;
    end_at: Date;
    hashcode?: string;
}


class EventClass {
    setHashcode(this: EventDocument) {
        let num = this._id.getTimestamp().getTime();
        let encoded = '';
        while (num) {
            let [quotient, remainder] = divmod(num, ALPHABET_LENGTH);
            num = quotient;
            encoded = ALPHABET[remainder].toString() + encoded;
        }
        this.hashcode = encoded;
    }
    static async createEvent(this: EventModel, englishName: string,
        startAt: Date, endAt: Date) {
        let doc: EventProperties = {
            english_name: englishName,
            start_at: startAt,
            end_at: endAt,
        };

        let event = new this(doc);
        event.setHashcode();
        try { return await event.save(); }
        catch (err) { throw err; }
    }
    static async listCurrentEvents(this: EventModel) {
        let now = new Date();
        let events = await this.find({
            start_at: { $gte: now },
            end_at: { $lt: now },
        });
        return events;
    }
    static async searchAndUpdate(this: EventModel, text: string,
        { chineseName, translationUrl }: { chineseName: string; translationUrl: string }) {
        let event = await this.findOne({ $text: { $search: text } });
        if (event) {
            event.chinese_name = chineseName;
            event.translation_url = translationUrl;
            try { await event.save(); }
            catch (err) { throw err; }
        }
    }
}
type Methods = typeof EventClass.prototype;
type Statics = typeof EventClass;
export interface EventDocument extends Document, EventProperties, Methods {
    _id: Types.ObjectId;
}
interface EventModel extends Model<EventDocument>, Statics { }


EventSchema.loadClass(EventClass);
export const Event = model<EventDocument, EventModel>('Event', EventSchema);
