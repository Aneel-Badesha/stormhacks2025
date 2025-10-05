import sqlite3

# Connect to the database
conn = sqlite3.connect('data/rewards.db')
cursor = conn.cursor()

# Update the company name and description
cursor.execute('''
    UPDATE companies 
    SET name = ?, description = ? 
    WHERE id = 1
''', ('Tim Hortons', 'Tim Hortons Tims Rewards loyalty program'))

conn.commit()

# Verify the change
result = cursor.execute('SELECT id, name, description FROM companies WHERE id = 1').fetchone()
print(f'Updated company: ID={result[0]}, Name={result[1]}, Description={result[2]}')

conn.close()
print('Company successfully updated to Tim Hortons!')