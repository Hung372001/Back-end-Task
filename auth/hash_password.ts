import bcrypt from 'bcrypt';

const hash_password = async (password: string): Promise<string> => {
    const saltRounds = 8;
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
}

const compare_password = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
}