const setofcharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const createApi = (): string => {
    let id = '';
    for (let i = 0; i < 10; i++) {
        id += setofcharacters.charAt(Math.floor(Math.random() * setofcharacters.length));
    }
    return id;
}
     
