import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SUPABASE_CONFIG } from './config.js'

class DatabaseManager {
    constructor() {
        this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.tableName = 'problems';
    }

    async init() {
        try {
            // Test connection
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('count')
                .limit(1);
            
            if (error) {
                console.error('Database connection error:', error);
                throw error;
            }
            
            console.log('Database connected successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    async getAllProblems() {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching problems:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Failed to get problems:', error);
            throw error;
        }
    }

    async addProblem(problem) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert([{
                    id: problem.id,
                    name: problem.name,
                    link: problem.link || null,
                    difficulty: problem.difficulty,
                    category: problem.category,
                    platform: problem.platform,
                    date_added: problem.dateAdded,
                    completed_dates: problem.completedDates || []
                }])
                .select();

            if (error) {
                console.error('Error adding problem:', error);
                throw error;
            }

            return data[0];
        } catch (error) {
            console.error('Failed to add problem:', error);
            throw error;
        }
    }

    async updateProblem(problemId, updates) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', problemId)
                .select();

            if (error) {
                console.error('Error updating problem:', error);
                throw error;
            }

            return data[0];
        } catch (error) {
            console.error('Failed to update problem:', error);
            throw error;
        }
    }

    async deleteProblem(problemId) {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .eq('id', problemId);

            if (error) {
                console.error('Error deleting problem:', error);
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Failed to delete problem:', error);
            throw error;
        }
    }

    async clearAllProblems() {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .neq('id', ''); // Delete all rows

            if (error) {
                console.error('Error clearing problems:', error);
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Failed to clear problems:', error);
            throw error;
        }
    }

    async markProblemCompleted(problemId, completedDate) {
        try {
            // First get the current problem
            const { data: currentData, error: fetchError } = await this.supabase
                .from(this.tableName)
                .select('completed_dates')
                .eq('id', problemId)
                .single();

            if (fetchError) {
                console.error('Error fetching problem:', fetchError);
                throw fetchError;
            }

            const currentCompletedDates = currentData.completed_dates || [];
            
            // Add the new completion date if it doesn't exist
            if (!currentCompletedDates.includes(completedDate)) {
                currentCompletedDates.push(completedDate);
                
                const { data, error } = await this.supabase
                    .from(this.tableName)
                    .update({
                        completed_dates: currentCompletedDates,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', problemId)
                    .select();

                if (error) {
                    console.error('Error marking problem completed:', error);
                    throw error;
                }

                return data[0];
            }

            return currentData;
        } catch (error) {
            console.error('Failed to mark problem completed:', error);
            throw error;
        }
    }

    // Real-time subscription to changes
    subscribeToChanges(callback) {
        const subscription = this.supabase
            .channel('problems-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: this.tableName },
                (payload) => {
                    console.log('Database change:', payload);
                    callback(payload);
                }
            )
            .subscribe();

        return subscription;
    }

    unsubscribe(subscription) {
        if (subscription) {
            this.supabase.removeChannel(subscription);
        }
    }
}

export default DatabaseManager;
