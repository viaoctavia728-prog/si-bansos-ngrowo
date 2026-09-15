import pymysql

# Konfigurasi koneksi ke database XAMPP MySQL
def get_db_connection():
    connection = pymysql.connect(
        host="localhost",
        user="root",
        password="",  # XAMPP default password kosong
        database="db_sibansos_ngrowo",
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection